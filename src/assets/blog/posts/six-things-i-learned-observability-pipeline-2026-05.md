# Six Things I Learned Migrating an Observability Pipeline

Every observability migration has the same arc. You start with a working setup nobody loves, pick a destination platform that solves the loud problem, and three weeks later you've discovered six new failure modes nobody warned you about. This post is six of those failure modes from a recent project: moving 30-day SLA reporting off Splunk Summary Indexing onto a Lambda pipeline that aggregates in Coralogix and emits to Datadog. Each lesson lands the same way: a symptom that didn't say what it actually meant, a root cause that took longer than it should have, and a fix small enough that it's almost embarrassing in retrospect.

I'm collecting these because every one of them cost me at least half a day, and most are not on the first page of any vendor's docs.

## Lesson one: Datadog silently drops metrics older than an hour unless you opt in

The first backfill returned `rows_emitted: 200` with no error, no warning, no 4xx, no DLQ activity, and zero metrics in Datadog. The Lambda logs looked clean. The submit/reconcile/publisher chain ran end to end. The window in question was 18 hours old.

It turns out Datadog's [Historical Metrics](https://docs.datadoghq.com/metrics/custom_metrics/historical_metrics/) feature, the thing that lets you ingest points with timestamps from beyond the last hour, is **opt-in per metric name or namespace prefix**. Not org-level. Not workspace-level. Per-prefix. Without it, any point with a timestamp older than one hour is silently dropped on ingest. There is no error returned to the SDK. There is no telemetry on the publisher side. The only signal is the absence of the metric in the dashboard.

The fix is a one-time toggle in the metrics summary UI: pick the prefix, set "Enable historical metrics" to on. After that, the staircase of latencies kicks in (≤1h is near-instant, 1 to 12h is up to an hour, 12h to 30d is "overnight"). Before that, you're shouting into a void that politely throws your messages away.

The general lesson, and the one I keep getting taught, is that **vendor features can be silent opt-ins**. Don't assume that because the SDK accepts a write, the platform accepts the data. Test the round-trip on a feature flag boundary before you build infrastructure that depends on it.

## Lesson two: API key prefixes gate endpoints, not just accounts

For three days, every scheduled invocation of the submit Lambda returned `HTTP 403: Permissions are not granted` from Coralogix's DataPrime endpoint. No row was ever written to the in-flight ledger. The reconciler had nothing to reconcile. The publisher was never invoked. From a dashboard perspective the pipeline was running; from a data perspective nothing was happening.

The fix is one character. Coralogix issues two key prefixes: `cxup_*` is DATAQUERYING-scoped (which is what `/api/v1/dataprime/*` requires), and `cxtp_*` is SENDDATA-scoped (which is what the ingest endpoints accept). The secret had been populated with a `cxtp_*` key. Both keys belong to the same account, both have valid permissions for *something*, and the 403 response carries no hint about scope mismatch, just the generic "permissions not granted" body that you also get from a typo, an expired key, or a downed service.

The fix took twelve seconds once the prefix character was noticed. The secondary lesson, which cost another half-day after the rotation, is that **Lambda containers cache secrets aggressively**: `@lru_cache` on the secret-fetch helper means a hot container holds the stale value for hours. The fix for that was setting a throwaway environment variable to force a cold start.

So: when you rotate a vendor secret, rotate the key, rotate the container, *and* check that the prefix character matches the endpoint the consumer talks to.

## Lesson three: DataPrime's type-checker rejects string-vs-timestamp comparisons at compile time

This one bit me on a stitch filter that injected `| filter time_bucket >= '2026-05-19T14:00:00+00:00'` into every query. The query compiled cleanly in local tests against synthetic data and ran fine in the dev console. In production it returned HTTP 400 with `expected keyword ')'` pointing at a parenthesis four lines below the actual problem.

DataPrime's type system is strict about comparing typed columns to untyped literals. `time_bucket` is a `timestamp`-typed column produced by `roundTime(_time, 1m)`; the right-hand side of the comparison is, by default, a string. The compiler refuses to coerce, fails the parse, and emits an error pointing at the *unification site*, not the source. The fix is the four-character postfix cast that the rest of the query language already uses for `:string` and `:number` coercions:

```
| filter time_bucket >= '2026-05-19T14:00:00+00:00':timestamp
      && time_bucket <  '2026-05-19T15:00:00+00:00':timestamp
```

The general lesson is that **type errors at compile time can masquerade as syntax errors**. When a query compiles locally and fails remotely with a position that doesn't match the obvious bug, suspect the type-checker before the parser. Look for any literal that's being compared against a structurally typed column.

## Lesson four: async retries amplify non-idempotent emissions

Lambda's async-invoke retry machinery is one of the most quietly dangerous defaults I've shipped against. The publisher Lambda is invoked async by the reconciler on every terminal-success window. Lambda retries failed invocations up to two more times before sending them to the DLQ. The "failed" determination is made by the Lambda runtime, not the function code: a successful emit followed by an SDK-close timeout, a cold-start hang, a network blip past the function's return value can all flip the invocation to "failed" even when the work succeeded.

Datadog's count metrics dedupe server-side on `(name, timestamp, tags)`. So a count submission for the same window from a retry is a no-op. Distribution metrics, the kind you use for percentiles, *append*. A retry of an already-successful publisher run double-counts every distribution sample for that window. p99s are silently wrong; nobody pages, because the dashboards don't look broken, just slightly off.

The fix is a producer-side idempotency marker. Write a small `published/{asset}/{window_start}.json` object to S3 *after* a successful emit. HEAD-check it at the start of every publisher invocation. If the marker exists, log `publisher.skip_already_published` and return. Cost: one S3 HEAD + one S3 PUT per window. Benefit: distribution emits are now exactly-once at the producer.

The lesson generalizes: **idempotency is the producer's responsibility, not the sink's.** Never trust the sink to dedupe what the producer can replay.

## Lesson five: `MAX_RESULTS` is a window-tuning signal, not a retry-failure

Coralogix's background-query API caps each query at 1,000,000 result rows. Exceeding the cap returns a terminal-failure status with `MAX_RESULTS` in the error body. This is not a transient error. It is not retryable. It is not a sign of a broken pipeline. It is the platform's way of saying "your `(query, window_size, traffic_volume)` triple no longer fits, please tighten the window."

The trap is treating it as a generic failure. When traffic doubled on a particular asset, the reconciler started classifying every hourly tick as a terminal-error window and routing it to the regular ERROR-log alert. On-call got paged. On-call's runbook said "investigate," which led to a 40-minute investigation that ended with "yeah, traffic doubled, just halve the window." The platform was working as intended; the alert was working as intended; the *classification* was wrong.

The fix is structural: parse the terminal-failure body for the reason code, and route the `MAX_RESULTS` case to a remediation-bearing log line rather than a generic ERROR. Something like:

```
ERROR reconcile.terminal_failure
  reason_code=MAX_RESULTS
  remediation="tighten lookback_window for asset=<x> in its YAML"
```

The downstream alert rule then knows: a `MAX_RESULTS` signal is a YAML edit, not an outage. **Error semantics are part of your alerting architecture**, not just a debug aid.

## Lesson six: self-healing pipelines need a human in the loop

The ergonomic temptation when you ship an audit Lambda that detects gaps every fifteen minutes is to wire the audit directly to backfill. Gap detected, backfill invoked, on-call never paged. Self-healing infrastructure, the way the AWS pitches always promise.

Don't.

Three classes of failure show up in practice. The first is *transient*: a Coralogix 5xx, an EventBridge missed fire, a Lambda cold-start past the minute. Auto-heal is safe and correct. The second is *deterministic*: `MAX_RESULTS`, a query compile error, a broken YAML. Auto-heal will deterministically fail the same way every time, generating retry storms that drown the logs without making progress. The third is *systemic*: a Coralogix outage, a Datadog tenant incident, a runtime-wide Lambda problem. Auto-heal in this case *amplifies* the outage by spraying retries against an already-sick downstream.

Resolving this tension is the single hardest design problem in any self-healing pipeline, and it deserves its own post. I'll tackle it in [Part 3 of this series](/blog/self-healing-needs-a-human-in-the-loop-2026-05). The TL;DR is that you want bounded retries per window, a portfolio-wide circuit breaker per tick, an attempt counter that ages out cleanly after quiet periods, and *humans triggered for everything else*. The boundary between "auto-recover this" and "page someone" is your job to define and your code's job to enforce.

## What ties it together

Every lesson here is about a layer that didn't say what it actually meant. The platform accepted the write but didn't store it. The 403 didn't mention scope. The compile error blamed the wrong line. The retry was invisible. The terminal failure was indistinguishable from an outage. The "self-healing" wanted to retry an undecidable failure forever.

The mitigation in each case wasn't clever code. It was a small, specific assertion at the boundary: *check the historical-metrics flag before you backfill. Check the key prefix when you rotate. Cast your literals. HEAD-check before emit. Parse the reason code. Cap the retries.* Boundaries between systems are where lies live, and the only defense is making the boundary check explicit.

In [Part 2](/blog/why-we-didnt-use-kafka-2026-05) I look at one specific architectural choice that fell out of all this: why we didn't reach for Kafka, even when "use a queue" was the obvious instinct. In Part 3 I take on the self-healing-vs-human-in-the-loop question that Lesson 6 only teases.
