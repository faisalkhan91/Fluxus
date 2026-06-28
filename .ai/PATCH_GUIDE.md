# Patch Management Guide

This guide contains instructions for creating and applying patches between different environments (e.g., Windows and macOS) to ensure consistent results when working with Gemini CLI or Git.

## Best Practices for Creating Patches

To ensure patches are robust and include all necessary metadata, use `git format-patch` instead of a raw `git diff`.

### 1. Recommended Method (format-patch)

Run this from the branch containing your changes:

```bash
git format-patch main --stdout > portfolio-overhaul.patch
```

- **Why:** This includes commit messages, author info, and is designed to be applied with `git am`.

### 2. Alternative Method (git diff)

If you must use `git diff`, ensure you include binary support and full index information:

```bash
git diff --patch-with-stat --full-index --binary > portfolio-overhaul.patch
```

### 3. Cross-Platform Considerations

- **Line Endings:** Ensure `git config core.autocrlf` is set correctly:
  - Windows: `git config --global core.autocrlf true`
  - macOS/Linux: `git config --global core.autocrlf input`
- **Binary Files:** Always use the `--binary` flag if your changes include images or icons.

---

## Troubleshooting Patch Application

If `git apply` fails with errors like "lacks filename information" or "patch fragment without header", try the following:

### 1. Using the `patch` Utility

The standard `patch` utility is often more lenient than `git apply`.

**On Windows (PowerShell):**

```powershell
cmd /c "patch -p1 < portfolio-overhaul.patch"
```

**On macOS/Linux:**

```bash
patch -p1 < portfolio-overhaul.patch
```

### 2. Check Encoding

Ensure the patch file is saved with **UTF-8** or **ASCII** encoding. Some editors might save as UTF-16, which will break Git's patch parser.

### 3. Verify Path Prefixes

If the patch was created without `a/` and `b/` prefixes, you may need to adjust the `-p` level (e.g., `-p0` instead of `-p1`).

---

## Repeatable Agent Workflow: "Create a patch for this branch"

This is the exact, step-by-step procedure to follow when asked to create a patch
file for the current branch. It is written so another agent/prompt can replicate
the result deterministically.

### Step 1 - Inspect the current branch state

```bash
git status                         # confirm branch name + clean working tree
git log origin/main..HEAD --oneline   # list the commits unique to this branch
git log origin/main..HEAD --oneline | wc -l   # count them (sanity check for later)
```

- The base of comparison is **`main`** (the local `main` branch). Every commit on
  the current branch that is not already in local `main` is included in the patch.
- If the working tree is not clean, decide with the user whether uncommitted work
  should be committed first - `format-patch` only captures committed history.

### Step 2 - Derive the patch filename from the branch name

Strip the leading category segment (`feature/`, `feat/`, `fix/`, `chore/`,
`audit/`, `refactor/`, etc.) and keep the descriptive slug, then append `.patch`.

| Branch                         | Patch file                     |
| ------------------------------ | ------------------------------ |
| `chore/angular-22-upgrade`     | `angular-22-upgrade.patch`     |
| `feature/experience-narrative` | `experience-narrative.patch`   |
| `fix/service-worker-updates`   | `service-worker-updates.patch` |

The file is written to the **repository root**.

### Step 3 - Generate the patch

```bash
git format-patch main --stdout > <slug>.patch
```

- `--stdout` concatenates every commit into a single file (one `[PATCH n/m]`
  block per commit) instead of one file per commit.
- Prefer this over `git diff` because it preserves commit messages, author,
  date, and ordering, so the receiver can replay history with `git am`.

### Step 4 - Verify the result

```bash
ls -lh <slug>.patch                 # size sanity check
grep "^Subject:" <slug>.patch       # list every commit subject
grep -c "^Subject:" <slug>.patch    # must equal the count from Step 1
```

The `Subject:` count must match the commit count from Step 1; that confirms all
commits landed in the file.

### Step 5 - Handle large / binary-heavy patches

Binary assets (images, PDFs, videos, fonts) are embedded as base64 and can make
a patch very large (hundreds of MB across many commits). When the file is large:

- Mention the size to the user, and offer either of these:
  - **Strip binaries** (when assets are regeneratable or fetched separately):
    ```bash
    git format-patch main --stdout --no-binary > <slug>.patch
    ```
  - **Split into N parts** for transport, then reassemble before applying:
    ```bash
    split -l <lines-per-part> <slug>.patch <slug>-part-
    cat <slug>-part-* > combined.patch   # reassemble on the other side
    ```
    Note: split parts are NOT individually applicable - they must be
    concatenated back into a single file first.

### Step 6 - How the patch is applied later (for the receiver)

```bash
git am < <slug>.patch      # preferred: replays commits with full metadata
patch -p1 < <slug>.patch   # fallback if git am rejects the headers
```

### Operational notes

- Run all commands from the repository root. If the project directory was moved,
  re-point the agent root to the new path before running git (a stale working
  directory makes the shell appear to "hang" or return no status).
- `git format-patch main ...` uses the **local** `main`. If local `main` is behind
  `origin/main`, first decide whether to `git fetch` / reset so the patch base
  reflects the intended baseline.
