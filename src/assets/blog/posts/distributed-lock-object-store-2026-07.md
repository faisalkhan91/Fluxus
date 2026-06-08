# A distributed lock out of your object store

I had a fleet of stateless workers, each woken by the same fan-out event, each fully capable of picking up the same unit of work. Exactly one was supposed to run each window. There was no Redis in the diagram, no ZooKeeper, no lock table — and adding one felt absurd for a job that fired a few hundred times a day. So I leaned on the object store I already had, and for a few weeks it was perfect. Then two workers processed the same window with no error in either log, and I spent a half-day I want back learning exactly which guarantee I had actually been renting.

The mechanism is sound. The trap is that "sound" depends on a setting you didn't write, can't see in your code, and someone can flip.

## The problem: fan-out with no coordinator

The shape is common. An event fans out to N identical consumers — SQS with multiple pollers, a Lambda that scales horizontally, a Kubernetes deployment with several replicas. Each consumer is correct in isolation. The only thing wrong is that more than one of them runs.

The textbook answer is a coordination service: acquire a lock, do the work, release. That is the right answer when you need strict mutual exclusion. But it is also a new stateful dependency to provision, monitor, fail over, and reason about — and for low-frequency work it dwarfs the job it guards. The wider claim: every coordination service you add is a new failure domain, so the cheapest correct coordinator is one you already operate. If your architecture already has an object store, you may already own a usable one.

## The primitive: a conditional PUT and the 412

The object stores now expose a compare-and-set on key creation. On S3 you write with `If-None-Match: *`; the write succeeds only if the key does not yet exist. The first worker to claim the key wins. Every other worker gets `HTTP 412 Precondition Failed` and exits quietly.

```http
PUT /claims/window-2026-07-01T12:00 HTTP/1.1
If-None-Match: *

{ "worker": "w-3f9a", "expires_at": 1751370000 }
```

```python
try:
    s3.put_object(Bucket=b, Key=key, Body=body, IfNoneMatch="*")
    # we won the claim — do the work
except s3.exceptions.ClientError as e:
    if e.response["Error"]["Code"] == "PreconditionFailed":
        return  # someone else owns this window; exit clean
    raise
```

It is portable. GCS spells it `x-goog-if-generation-match: 0`; Azure Blob uses `If-None-Match: *`. So the same claim pattern works across the big three with a different header. The wider claim: a create-only conditional write is a distributed compare-and-set, and a compare-and-set is enough to elect a single winner among racers. You do not need a consensus protocol to pick one writer; you need one atomic decision point, and the object store is already that.

## Claim versus lock: there is no fencing token

Here is the line I blurred for too long. What you get is a claim — a lease — not a fencing lock. The difference is the fencing token.

A real lock service hands the winner a monotonically increasing token, and downstream systems reject any write carrying a stale token. That is what makes a lock safe against a stalled holder: a worker that pauses for a GC, a slow disk, a paused container, then resumes after its lease is gone, gets its writes rejected by the token check.

A conditional PUT gives you no such token. The claim key says "someone won at time T," nothing more. A worker that wins the claim, stalls past its lease, and resumes will happily keep acting — and the store has no way to stop it. So you must design downstream to tolerate two actors for the same window. Make the writes idempotent: upsert on a dedup key, last-writer-overwrite, no blind appends. The wider claim: without a fencing token you cannot have mutual exclusion, only mutual discouragement, so the safety has to live in the writes, not the lock. If correctness depends on the second worker being unable to write, this primitive is the wrong tool.

## Leases expire, and the TTL is load-bearing

A claim with no expiry is a leak. A worker dies mid-window, its key sits there forever, and that window is permanently un-runnable. So the claim carries an `expires_at`, and something reclaims stale claims — an object-lifecycle rule, or a sweeper that deletes keys past their expiry.

Sizing that TTL is not a throwaway constant. It has to exceed the worst-case run, not the average. If the TTL is shorter than how long a healthy worker can legitimately take, the claim expires out from under a worker that is still working, the sweeper reclaims it, and a second worker picks the window up — you have manufactured the exact double-run you were trying to prevent. I size TTL at a comfortable multiple of the observed p99 runtime, then alarm if any run approaches it.

```text
TTL  >  worst-case run time   (not the mean — the tail you actually see)
```

The wider claim: a lease TTL is a bet that a live worker always finishes before its claim expires, and like every timeout in a distributed system it trades liveness against safety. Too long and dead work stalls; too short and live work collides. Measure the tail before you pick the number.

## The guarantee you're renting

This is the part that cost me the half-day. The at-most-once behavior does not come from my code. It comes from the bucket honoring the precondition semantics — which is a property of the bucket's configuration, not of the request. Toggle that setting off and the conditional PUT does not error. It silently degrades to last-write-wins. Both workers "win" their claim, both run the window, and nothing anywhere logs a problem. The signal looks clean because every individual call returned 200.

A setting that lives outside your repository, that no code review will catch, and whose failure mode is silence is the most dangerous kind of dependency. The defense is a cold-start probe: on startup, read the bucket configuration and assert it is exactly what the primitive requires. If it isn't, refuse to run and page loudly.

```python
cfg = s3.get_bucket_versioning(Bucket=b)
if cfg.get("Status") != "Enabled":
    raise SystemExit("claim bucket not in required mode — refusing to start")
```

The wider claim: when your correctness rents itself from a configuration flag, assert the flag at startup, because the alternative is discovering it from a data discrepancy weeks later. A guarantee you assume but never check is a guarantee you don't have.

## When not to do this

The pattern earns its keep at low-to-moderate contention with idempotent downstreams. It stops being enough in three places, and they are worth naming up front so you reach for the right tool instead of bending this one.

High contention turns into 412 storms: if hundreds of workers race the same key every second, you are paying request cost and latency to have all but one fail, and the object store's per-key throughput becomes the bottleneck. Strict mutual exclusion — where a second writer must be impossible, not merely discouraged — needs fencing tokens this primitive cannot provide. And sub-second lease churn, where claims are acquired and released faster than the store's consistency and lifecycle machinery comfortably moves, is squarely Redis or a real lock service territory.

The wider claim: cheap coordination scales with how much you can tolerate, not how much you can lock; the moment you need true exclusion or high churn, the object-store trick is a liability dressed as a saving.

A precondition is a compare-and-set, and a lease built on one is only ever as strong as the setting it silently assumes. Know which guarantee you are renting, write the probe that proves you still have it, and make the work underneath survive the day you don't.
