# Idempotency is the producer's job

For about three weeks a p99 latency panel read roughly 8% high. Not spiking, not flatlining — just consistently, plausibly elevated, in the range where you start asking whether a dependency got slower or a GC tuning change regressed. We spent a half-day I want back bisecting deploys before someone noticed the sample _count_ on that distribution was also high, by about the same margin. The percentiles weren't measuring a slow system. They were measuring the same windows twice.

The duplicates came from a publisher invoked asynchronously once per completed window, retried by the runtime, emitting into a histogram that appends every sample it receives. Nothing was broken. Everything was at-least-once, working as designed, and lying to us in a way no alert was shaped to catch.

## A metric that was wrong but never broken

The reason this survived three weeks is that it never tripped a threshold. A doubled count metric looks like more traffic, which nobody questions. A 30% percentile blowout pages someone. An 8% one reads as drift — the kind of number you rationalize, attribute to a noisy neighbor, and put on a "look at it next sprint" list.

The mechanism was a replay. The publisher ran, emitted its samples, then hit a slow SDK shutdown and got retried. The second run re-emitted the same window. Because the sink appended rather than deduped, every sample landed twice, and p99 shifted toward the tail it now had two copies of.

The wider claim: the dangerous failures are the ones calibrated just below your alert thresholds. A system that fails loudly gets fixed; a system that is quietly, defensibly wrong erodes trust in every number it produces.

## At-least-once is the floor, not a degraded mode

The instinct is to call this a bug in the runtime. It isn't. "Exactly once" is mostly a myth at the transport layer — you are handed at-least-once and you build idempotency on top of it. Once I started looking, the duplicate sources were everywhere I'd already deployed against:

- **Async-invoke retries.** The runtime, not your function, decides what "failed" means. A successful side effect followed by a connection close or network timeout flips the whole invocation to failed, and it retries. Your code already did the work; the platform doesn't know that.
- **At-least-once queues.** Visibility timeouts, in-flight redelivery, consumer crashes after handling but before ack.
- **Webhook redelivery.** The sender retries until it sees a 2xx; a slow response means it sends again even though you processed the first.
- **Client retries.** The most boring one. A timeout on the caller's side that the server actually completed.

Every one of these shares the same shape: the effect happened, the acknowledgment didn't make it back, so the work runs again. There is no configuration flag that removes this. You can lower retry counts and tighten timeouts, but you cannot get the probability to zero, and designing as if you could is how you end up with the metric above.

The wider claim: treat duplicate delivery as a guaranteed input, not an edge case. If your correctness depends on something running exactly once, you have a latent incident, not a working system.

## Additive sinks versus deduped sinks: the silent doubler

What turned a routine retry into weeks of wrong data was the sink's behavior, and this is the asymmetry worth internalizing. Sinks fall into two camps and they fail in opposite directions.

Many counter and count metrics dedupe server-side on something like `(name, timestamp, tags)`. Send the same point twice for the same second with the same tags and the backend collapses it. You get away with the replay for free, which is exactly why people generalize "the sink will handle it" — they've only ever tested against a deduping sink.

Distribution and histogram metrics **append**. There is no key to collapse on; every sample is a distinct observation by design. A replayed batch double-counts every sample and corrupts the percentiles, and it does so without any error, because appending is the correct behavior for that data type. The same logic applies to append-only tables, event logs, and ledger rows: the structure that makes them useful — every entry is real and ordered — is exactly what makes them defenseless against a replay.

```
window W emitted once  -> [12ms, 40ms, 800ms]      p99 ≈ 800ms
window W emitted twice -> [12,40,800, 12,40,800]    p99 still 800ms by value,
                                                     but the tail mass doubled
                                                     and the count is 2x — every
                                                     downstream rate and percentile
                                                     computed off it now drifts
```

The wider claim: before you reason about delivery, classify your sink. A deduping sink hides your duplicates and lets bad assumptions live; an additive sink amplifies them. The append-only stores you reach for precisely because they never lose data are the ones with no native defense against being told the same thing twice.

## The producer-side marker: check-and-skip

The fix is unglamorous and lives entirely on the producer. After a unit of work succeeds, write a small marker keyed by that unit. At the start of every attempt, check for the marker and skip if it's there.

The unit of work has to be something both attempts compute identically. For a per-window publisher, that's the entity and the window boundary — not a UUID, not a timestamp generated at runtime, because the retry has to derive the same key the original did.

```python
key = f"{entity}/{window_start}"          # identical across retries

if marker_store.exists(key):              # one extra read
    return                                # already emitted this window

emit(samples)                             # the effect
marker_store.put(key, ttl=retention)      # one extra write
```

One read and one write buys exactly-once at the producer. There's a real ordering subtlety: if you write the marker before the emit and then crash, you've now permanently suppressed a window that never landed. I'd rather risk a rare double-emit than a silent drop, so the marker goes _after_ the effect — which means the window between emit and marker is still replayable, and the sink-side key (next section) closes it. Pick the failure you can tolerate and order the writes to favor it.

The wider claim: idempotency is cheap to add at the producer and expensive to bolt on anywhere else. One extra round-trip per unit of work is a rounding error against the cost of debugging corrupted aggregates after the fact.

## The idempotency key at the sink: the other half

The marker handles the case where the same producer instance retries. It doesn't help if two producers race, or if the marker write itself is the thing that failed. The other half is a natural idempotency key carried into the sink: a unique constraint, a conditional insert, a write that no-ops on conflict.

```sql
insert into window_emissions (entity, window_start, ...)
values (...)
on conflict (entity, window_start) do nothing;
```

This works when the sink _has_ a key to enforce — Postgres, a keyed object store, anything with a uniqueness guarantee. It does not work for distributions and append-only logs, which have no notion of "the same row." For those, the producer-side marker is not a nicety; it's the only line of defense, because the sink fundamentally cannot tell a legitimate re-emit from a duplicate. It was never given a key to make that judgment.

That's the real argument against "just let the sink dedupe." The sink can only dedupe what the producer chose to make dedupable. A duplicate and a deliberate re-emit are byte-identical from where the sink sits; the only system that knows which one it's sending is the one doing the sending.

The wider claim: dedup needs a key, and the key has to come from whoever knows the identity of the work. Push that responsibility downstream and you've asked the sink to read your mind.

So: at-least-once is the floor, additive sinks turn replays into silent corruption, and the only party that can tell a replay from a real event is the one replaying it. Never trust the sink to dedupe what the producer can replay. Idempotency lives at the point of replay — everywhere else, it's a guess.
