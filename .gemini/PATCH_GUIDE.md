# Patch Management Guide

This guide contains instructions for creating and applying patches between different environments (e.g., Windows and macOS) to ensure consistent results when working with Gemini CLI or Git.

## Best Practices for Creating Patches

To ensure patches are robust and include all necessary metadata, use `git format-patch` instead of a raw `git diff`.

### 1. Recommended Method (format-patch)
Run this from the branch containing your changes:
```bash
git format-patch main --stdout > portfolio-overhaul.patch
```
*   **Why:** This includes commit messages, author info, and is designed to be applied with `git am`.

### 2. Alternative Method (git diff)
If you must use `git diff`, ensure you include binary support and full index information:
```bash
git diff --patch-with-stat --full-index --binary > portfolio-overhaul.patch
```

### 3. Cross-Platform Considerations
*   **Line Endings:** Ensure `git config core.autocrlf` is set correctly:
    *   Windows: `git config --global core.autocrlf true`
    *   macOS/Linux: `git config --global core.autocrlf input`
*   **Binary Files:** Always use the `--binary` flag if your changes include images or icons.

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
