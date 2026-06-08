# Success is not completeness

A failure-rate metric on a dashboard I owned sat at roughly 50% for most of a morning. It was confident and stable — not spiking, not flapping, just a flat line at a number that should have triggered a page. The truth was a fraction of a percent. There was no error, no truncation warning, no failed request anywhere in the chain. The query returned `COMPLETED` every time, and the aggregate it fed was about 300x off on a number that carried a contractual penalty.

The bug was not in my math. It was that the API answered a different question than the one I asked, and told me it had answered mine.

## The clean-looking lie

I was running an analytics query against a data API without specifying a result limit. The response came back with status `COMPLETED`, an `outputRowCount` of exactly 2000, and nothing else. No flag, no warning field, no partial-result indicator. The volume and scan limits were untouched, so this was not the backend protecting itself from a huge payload — it was a default row-count cap, applied silently because I hadn't said otherwise.

That distinction matters. A data-size guard would have shown up as bytes-scanned pressure I could have seen. A row-count default leaves no fingerprint in the places you'd think to look. The query planner did its job, returned the first 2000 rows it assembled, marked the call successful, and moved on. Every layer downstream treated `COMPLETED` plus a clean HTTP status as "you have the data."

The wider claim: a successful response describes the transaction, not the dataset. Status fields answer "did the call resolve?" — they make no promise that the rows you got are the rows that exist.

## A capped aggregate is worse than a missing one

A missing result is loud. A capped one is quiet and plausible, which is strictly more dangerous.

When you aggregate over a truncated read, you are aggregating over an arbitrary subset. The 2000 rows you received are not a representative sample — they're whatever the engine materialized first, with no guarantee that ordering correlates with anything you care about. So both the numerator and the denominator of any rate are computed against the wrong population. My failure rate looked like ~50% because the truncated slice happened to be enriched with failures; another run on slightly different data would land somewhere else entirely.

That non-determinism is the tell people miss. A broken pipeline that returns nothing gets noticed by lunch. A pipeline that returns a different wrong number every run gets rationalized — "metrics are noisy," "let's wait for it to settle." It never settles, because there's nothing converging; you're sampling an arbitrary prefix of an unordered result each time.

```text
true population:   80,000 rows,  ~0.4% failures
returned:           2,000 rows,  failure share ≈ 50%
ratio off by:      ~300x, and it moves every run
```

The wider claim: silent truncation doesn't just lose precision, it destroys the validity of every ratio built on top of it. A wrong-but-stable number earns trust it has not paid for, and a wrong-and-unstable one gets dismissed as noise. Both outcomes are worse than an empty result.

## The one assertion that catches it

When there is no warning field to read, you need a tell that doesn't depend on the vendor volunteering one. There is exactly one reliable signal: compare the rows you got back against the limit that was in effect.

```python
if returned_rows >= effective_limit:
    raise TruncationSuspected(
        f"got {returned_rows} rows at limit {effective_limit}; "
        "result is suspect, not complete"
    )
```

If `returned_rows == limit`, you almost never have exactly that many real rows — you have a result that hit the ceiling. Equality-to-the-limit is the boundary case, and the correct interpretation of the boundary is "probably truncated," not "happened to fit perfectly." Treat it as suspect and force the question: was this capped?

The subtlety is that you must know the _effective_ limit, including the default you never set. If you don't pass a limit, the limit is not "none" — it's whatever the server picked, and that's the number your assertion has to compare against. The day I added this check, the green query turned red immediately, which is exactly what I wanted: a failure I can see beats a success I can't trust.

The wider claim: when a system won't tell you it truncated, the only durable defense is an invariant you assert yourself. `returned >= limit` is that invariant, and it costs one comparison.

## The soft-default versus explicit-limit asymmetry

Here is the part that cost me a half-day I want back. I assumed that because the API warned on some limits, the absence of a warning meant completeness. It does not.

Many data APIs distinguish between the limit _you_ set and the default they apply for you. If you pass an explicit `LIMIT` and the result exceeds it, you often get a warning or a truncation flag — the system knows you stated an expectation and tells you it was clipped. But the _soft default_, applied because you said nothing, ships silently. The same engine that politely flags an explicit overflow says nothing at all about the cap it chose on your behalf.

So "no warning" is evidence of nothing. It is consistent with both "complete result" and "silently capped at a default you didn't know existed." The two states are indistinguishable from the warning channel, which means you cannot use that channel to tell them apart.

The wider claim: absence of a warning is not evidence of completeness when the warning is only wired to the path you didn't take. Read the docs for what triggers the flag, not just whether a flag exists — and assume the default path is the unmonitored one.

## The shape repeats everywhere

Once you see this, you see it across half your stack, because the failure shape is identical regardless of vendor:

- **Pagination** that returns the first page plus a `next_cursor` you forgot to follow. You processed page one and called it the dataset.
- **Trace backends** that sample. Your p99 is computed over the spans that survived sampling, not the spans that happened.
- **SQL clients** with a default fetch cap — the driver stops pulling rows at some number and the cursor just... ends, no exception.
- **Search APIs** with a `max_hits` ceiling, where hit 10,001 simply doesn't exist as far as your aggregation is concerned.

Every one of these reports success. Every one hands you a prefix and lets you mistake it for the whole. The cursor you ignored, the sample you forgot was a sample, the fetch cap baked into the driver default — same bug, different label.

The wider claim: "the API returned" and "I have all the matching records" are different propositions, and almost every data interface conflates them by default. Train yourself to ask the second question every time the first one looks fine.

## The fix is layered, not a flag

There is no single setting that makes this go away, because the problem spans the call, the contract, and the cardinality of your data. The defense has three layers.

First, a **truncation guard**: the `returned >= limit` assertion above, applied at the boundary where you read results. If it trips, fail or flag — never aggregate. This catches the bug even when you've misconfigured everything else.

Second, **set the limit explicitly and know the hard ceiling**. Don't ride the soft default; state a limit so your guard has a known value to compare against, and find out what the _hard_ ceiling is. In my case the soft default was 2000 while the hard ceiling was in the tens of thousands — two orders of magnitude of headroom I wasn't using because I never asked.

Third, where true cardinality can exceed _any_ ceiling, **reduce what you ask for** instead of hoping it fits. Group at a coarser grain, narrow the time window, pre-aggregate server-side. If a complete answer cannot fit under the hard ceiling, raising the limit just moves the silent failure further out; the only correct move is to make the result smaller than the wall.

The wider claim: completeness is something you engineer for, not something the response grants you. The guard catches the failure, the explicit limit gives the guard teeth, and reducing cardinality removes the failure mode entirely.

A status code is a statement about the call, not about the data. `200 COMPLETED` means the bytes came back and the connection closed clean — it says nothing about whether those bytes are the answer to your question. Assert your own invariant on completeness, because no sink is obligated to tell you what it left out.
