# Six layers that lied

The first backfill of the new pipeline returned `rows_emitted: 200` to its caller, no error, no 4xx, no DLQ activity, and zero metrics in Datadog. The Lambda logs looked clean end-to-end. The window we were trying to recover was eighteen hours old.

That ended up being the cheapest of the six bugs in this post, and it's still a half-day I want back. The project was a fairly ordinary observability migration: thirty-day SLA reporting moving off Splunk Summary Indexing onto a Lambda pipeline that aggregates inside Coralogix and emits to Datadog. The shape of the pipeline is roughly what you'd guess: per-asset YAML, an EventBridge cron firing the submit handler every minute, a reconciler polling for terminal states, a publisher fanning aggregated rows out to Datadog metrics, an audit job catching gaps, and a backfill handler for the rare case the audit can't auto-resolve.

Here are six layers that lied to me, and the small assertions that caught them.

## Datadog drops historical metrics silently unless you opt in

The eighteen-hour-old window came back empty because Datadog's [Historical Metrics](https://docs.datadoghq.com/metrics/custom_metrics/historical_metrics/) feature, the thing that lets you submit points with timestamps from outside the last hour, is opt-in *per metric name or namespace prefix*. Not org-level, not workspace-level, per-prefix. Without it, every point your SDK uploads with a timestamp older than `now - 1h` is silently discarded at the ingest gateway. There is no error returned to the SDK. There is no telemetry on the publisher side. The only signal is that the metric you swore you wrote is missing from the dashboard.

The fix is one click in the metrics summary UI: pick the prefix, set Enable historical metrics to on. After that, the documented latency staircase kicks in. Below an hour is near-instant. One to twelve hours lands within the hour. Twelve hours to thirty days lands overnight.

The pattern this represents is more interesting than the bug. Vendor APIs frequently distinguish *write accepted* from *data persisted*, and the gap between those two states tends to be invisible from the client. The discipline I now apply: any time I'm writing to a vendor API for a use case that isn't the obvious happy path, I write one round-trip integration test that asserts the data shows up where I expect to read it. Cheap, ugly, catches this entire class of failure.

## API key prefixes gate endpoints, not just accounts

For three days every scheduled invocation of the submit Lambda returned `HTTP 403: Permissions are not granted` from Coralogix's DataPrime endpoint. No row was written to the in-flight ledger, the reconciler had nothing to reconcile, and the publisher was never invoked. The pipeline looked busy from the outside (Lambdas firing, no Lambda errors, the EventBridge rules active) and was doing nothing.

The fix was one character. Coralogix issues two key prefixes for two scopes: `cxup_*` is DATAQUERYING (which `/api/v1/dataprime/*` requires), and `cxtp_*` is SENDDATA (which the ingest endpoints require). The secret had been populated with a `cxtp_*` key. Both keys belong to the same account, both have valid permissions for *something*, and the 403 response carries no hint about scope. You get the same body for a typo, an expired key, a downed service, and a scope mismatch.

The cost-multiplier on this bug came from a second layer. After the secret was rotated, every Lambda continued to return 403 for hours. Cause: `@lru_cache` on the secret-fetch helper was holding the stale value in the warm container. The fix was setting a throwaway environment variable to force a cold start, which I'd recommend baking into your secret-rotation runbook regardless of whether you've ever hit this.

When a vendor's secret-rotation flow involves more than one possible scope, validate the prefix of what landed in your secret store before you ship.

## DataPrime types matter at compile time, not query time

This one bit me on a stitch filter that injected `| filter time_bucket >= '2026-05-19T14:00:00+00:00'` into every query. It compiled cleanly in local tests against synthetic data, ran fine in the dev console, and returned `HTTP 400 expected keyword ')'` in production, with the parser pointing at a parenthesis four lines below the actual problem.

`time_bucket` is a `timestamp`-typed column produced by `roundTime(_time, 1m)`. The right-hand side of the comparison is, by default, a string. DataPrime's compiler refuses to coerce, fails the parse, and emits an error pointing at the unification site, not the source. The fix is the four-character postfix cast that the rest of the query language already uses for `:string` and `:number`:

```
| filter time_bucket >= '2026-05-19T14:00:00+00:00':timestamp
      && time_bucket <  '2026-05-19T15:00:00+00:00':timestamp
```

The general shape is worth holding onto. Type errors at compile time can masquerade as syntax errors when the compiler reports the position where unification failed instead of the position of the literal. Whenever a query compiles locally and fails remotely with a parse error pointing somewhere implausible, suspect the type-checker before the parser, and look for any literal compared against a structurally typed column.

## Async retries amplify non-idempotent emissions

Lambda's async-invoke retry behavior is one of the more quietly dangerous defaults I've shipped against. The publisher in this pipeline is invoked async by the reconciler on every terminal-success window. Lambda retries failed invocations up to two more times before sending them to the DLQ, and the determination of *failed* is made by the runtime, not the function. A successful emit followed by an SDK-close timeout, a cold-start hang, a network blip past the function's return value, all of these flip the invocation to failed even when the work succeeded.

Datadog's count metrics dedupe server-side on `(name, timestamp, tags)`. Distribution metrics, which is what you use for percentiles, append. A retry of an already-successful publisher run double-counts every distribution sample for that window. p99s come out silently wrong. Nobody pages, because the dashboards don't look broken; they look slightly off in a way that's easy to dismiss.

The fix is a producer-side idempotency marker. After a successful emit, write a small `published/{asset}/{window_start}.json` object to S3. HEAD-check it at the start of every publisher invocation. If the marker exists, log a `publisher.skip_already_published` event and return. The cost is one S3 HEAD plus one S3 PUT per window. The benefit is exactly-once distribution emission at the producer.

The wider claim: idempotency is the producer's responsibility, not the sink's. Never trust the sink to dedupe what the producer can replay.

## `MAX_RESULTS` is a tuning signal, not a retry-failure

Coralogix's background-query API caps each query at one million result rows. Exceeding the cap returns a terminal-failure status with `MAX_RESULTS` in the error body. This is not transient and it is not retryable. It is the platform telling you that your `(query, window_size, traffic_volume)` triple no longer fits and asking you to tighten the window.

The trap is treating it as a generic failure. When traffic on one asset doubled overnight, the reconciler started classifying every hourly tick as a terminal-error window and routing it to the regular ERROR-log alert. On-call got paged at three in the morning. The runbook said *investigate*, which led to a forty-minute investigation that ended with *yeah, traffic doubled, halve the window*. The platform was working as intended; the alert was working as intended; the *classification* was wrong.

The fix is structural. Parse the terminal-failure body for the reason code, and route the `MAX_RESULTS` case to a remediation-bearing log line rather than a generic ERROR:

```
ERROR reconcile.terminal_failure
  reason_code=MAX_RESULTS
  remediation="tighten lookback_window for asset=<x> in its YAML"
```

The downstream alert rule then knows: a `MAX_RESULTS` signal is a YAML edit, not an outage. Error semantics are part of your alerting architecture, not a debugging aid you decode after the fact.

## Self-healing pipelines need guardrails

The audit job in this pipeline runs every fifteen minutes, diffs expected cron ticks against `completed/` markers, and emits an ERROR per missing window. The natural next step, the one I almost shipped, is to wire the audit directly to backfill: gap detected, backfill invoked, on-call never paged. Self-healing infrastructure, the way the cloud-vendor pitches always promise.

Don't ship that until you've thought through what it does on a deterministic failure or a systemic outage.

A `MAX_RESULTS` window will deterministically fail under retry. So will a query that won't compile, a YAML that won't parse, an IAM permission that hasn't propagated. Auto-recovery on those generates retry storms that drown the logs and burn through your downstream's rate limit without making progress. And when the failure is systemic (Coralogix down, Datadog tenant incident, EventBridge regional outage), auto-recovery actively makes the outage worse: every retry is another query against an already-sick downstream.

The shape of the right answer is a classification gate. Bound retries per window, page on the cap. Add a portfolio-wide circuit breaker so a wave of simultaneous gaps escalates eagerly rather than quietly hammering. Reset attempt counters after a quiet period so a fixed bug unsticks on its own. None of this is hard; the hard part is admitting that "self-healing" is a property of a *subset* of failure modes and committing to the classification work to tell them apart.

I get into the actual mechanics in [Part 3 of this series](/blog/self-healing-needs-a-human-in-the-loop-2026-05).

---

The thing all six of these have in common is a layer that didn't say what it actually meant. The platform accepted a write but didn't store it. The 403 didn't mention scope. The compile error blamed the wrong line. The retry was invisible to the function. The terminal failure was indistinguishable from an outage. The self-healing wanted to retry an undecidable failure forever. In every case the fix was a small, specific assertion at the boundary: round-trip the write, check the prefix, cast the literal, HEAD-check before emit, parse the reason code, cap the retries. Boundaries between systems are where lies live, and the only defense is to make the boundary check explicit.

[Part 2](/blog/why-we-didnt-use-kafka-2026-05) takes on a related architectural decision that fell out of all this: why we didn't reach for Kafka, even though "use a queue" is the obvious instinct.
