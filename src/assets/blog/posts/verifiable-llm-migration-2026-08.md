# An LLM is a fine translator the moment you can grade it

The query came back clean. It parsed, it ran against production data without an error, and it returned a few thousand rows that looked exactly like what I expected — a daily pass-rate number sitting in a believable range. I almost signed off on it. Then I ran the original against the same window out of habit and the two numbers disagreed by something like 99%. The translation hadn't failed. It had succeeded at being wrong.

I had handed an LLM a query in one analytics language and asked for the equivalent in another, and it gave me back something that compiled, executed, and lied. The half-day I spent untangling why is the subject of this post, because the lesson generalizes well beyond one pair of query languages.

## The translation that compiled and lied

When you ask a model to port code from one language to another, the feedback you get for free is syntactic. The target parser accepts it or rejects it. If it parses, you run it; if it runs, you get rows. Every signal in that loop is about _form_. None of it is about whether the output means the same thing as the input.

For a translation task this is exactly backwards. A syntactically valid query in the target language is the floor, not the ceiling. The interesting failures are the ones that clear every form check and still compute a different answer — and those are precisely the ones the compiler is structurally incapable of seeing. The wider claim: in any migration, the bugs that survive to production are the ones your existing tooling was never designed to detect. Form-checking tools cannot find meaning bugs.

## Why "compiles" is the weakest possible signal

"It compiles" tells you the model produced grammar. That is the one thing modern LLMs are genuinely excellent at and the one thing that carries almost no information about correctness. A confident, fluent, well-formed wrong answer is the default failure mode of these systems, not an edge case.

"It runs and returns rows" is barely stronger. A query that drops half its input still returns rows. A query that misclassifies every record still returns a count. Plausibility is not correctness, and on aggregate data plausibility is cheap — almost any structurally-valid query over real data lands somewhere in a believable range.

So the question to ask of any LLM-produced port is not "does it work?" but "what oracle do I have that can tell me it's wrong?" If the only oracle you own is the compiler, you have no oracle. The wider claim: the trustworthiness of an LLM on a task is bounded by the strength of the check you can run on its output, not by the apparent quality of the output.

## The two faces of semantically-wrong

The divergence I hit came in two flavors, and both are worth recognizing on sight because they recur across every translation I've done since.

The first is a **function-semantics mismatch**. The source language's "first matching value" function returned `null` when the first event in a group simply lacked the field. The target language's nearest equivalent skipped nulls and returned the first _present_ value instead. On a dense field nobody would ever notice. On a sparse field — one populated in a small fraction of events — the two functions select completely different rows, and a downstream pass/fail threshold flips. That is how a query lands 99% off. Two functions with the same English description, `first()` versus `any_value()`-style, do not have the same semantics on missing data.

The second is a **hardcoded environment assumption**. The model pinned a single source literal — one namespace, one index, one tenant — into the `where` clause, because the example it pattern-matched on had one. The real data spanned two. The query silently dropped roughly half the rows and returned a number that still looked like a perfectly valid pass rate.

```text
-- model emitted (looks fine, drops ~half the data):
filter source == "namespace-a"

-- reality the source system actually queried:
filter source in ("namespace-a", "namespace-b")
```

Both bugs share a property: the output is a number, the number is in range, and nothing in the toolchain objects. The wider claim: an LLM's most expensive mistakes are the ones that produce a confidently plausible value, because plausibility is what disarms your review.

## The oracle: diff against the source, then auto-tune

The fix is not a better prompt. It is refusing to evaluate the translation in isolation. As long as the system you're migrating _from_ is still running, you already own a ground-truth generator — so use it. Run both queries over the same window and compare. Not "does the new one look right" but "is the per-dimension delta against the old one near zero."

```text
generate (LLM) -> run BOTH over same window
              -> diff row counts + per-dimension breakdown
              -> feed the diff back into the prompt
              -> regenerate
repeat until delta ~ 0
```

Comparing a single scalar isn't enough; two wrong queries can collide on the same total. Break the result down by every grouping dimension you have and require each bucket to reconcile. When a bucket is off, that delta is the most useful thing you can hand back to the model: "your output undercounts `namespace-b` by 100%" points straight at the pinned literal far faster than I would have found it reading the query.

This is the whole discipline in one line: the LLM proposes, an automated ground-truth comparison disposes. The model is allowed to be creative because the diff is not. The wider claim: an LLM is safe on a translation exactly when you have a cheap, automatic oracle to grade it against — and a migration off a still-running system hands you that oracle for free. Don't decommission the old thing until the diff is flat.

## Pre-flight checks, and telling a defect from a gap

Two refinements made the loop cheap enough to run hundreds of times.

First, a static pre-flight. Some failures are guaranteed before you ever execute — the target language lacks a keyword the source leans on (no `in`, a different join model, a missing function). Scanning the generated text for a small list of known-unsupported tokens _before_ spending an API round trip turns a slow runtime error into an instant local reject and regenerate.

```python
BANNED = {" in ", "transaction", "earliest("}  # no target equivalent
if any(tok in generated for tok in BANNED):
    regenerate("uses unsupported construct; rewrite without it")
```

Second — and this one saved me from chasing ghosts — distinguish a _generation defect_ from a _data-availability gap_. If the converted query is structurally sound and the target store returns 0 on the bare terms, that is very often not a bad translation. It means the data the source system had isn't present in the target yet. Pinning the difference matters: a defect goes back into the tuning loop; a gap gets logged and skipped, because no amount of regeneration will conjure rows that aren't there. The wider claim: a feedback loop is only as good as its ability to attribute a failure to the right layer — burning iterations re-translating around missing data is how you convince yourself the model is worse than it is.

---

I came out of this trusting LLMs for translation _more_, not less — but only inside the harness. The model is a strong, fast, tireless translator, and it is wrong often enough that I will never again grade it by reading its output and nodding. The thing that changed wasn't the prompt; it was building the diff. An LLM is a fine translator the moment you can grade it. Porting one query language to another is a data problem, not a syntax problem, and "it compiles" is the weakest signal you will ever be offered.
