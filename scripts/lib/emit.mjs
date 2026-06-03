/**
 * Helpers for emitting committed generated files (image-dims.generated.ts,
 * image-variants.generated.ts, posts.json reading times, …).
 *
 * The prettier "resolve project config, format, fall back to raw on failure"
 * dance was copy-pasted across several writers with inconsistent import
 * styles (some static `import prettier`, some dynamic). Prettier is treated
 * as a SOFT dependency here — dynamically imported so the scripts still run
 * (emitting unformatted output, which CI's `prettier --check` then flags) on
 * an install without it.
 */
import { writeFileSync } from 'node:fs';

/**
 * Format `source` with the project's prettier config for `filepath`. Returns
 * the formatted string, or the original `source` unchanged if prettier is
 * unavailable.
 */
export async function formatWithPrettier(source, filepath) {
  try {
    const prettier = await import('prettier');
    const config = (await prettier.resolveConfig(filepath)) ?? {};
    return await prettier.format(source, { ...config, filepath });
  } catch {
    return source;
  }
}

/** Format `source` and write it to `filepath`. Returns the written string. */
export async function writeFormatted(filepath, source) {
  const out = await formatWithPrettier(source, filepath);
  writeFileSync(filepath, out, 'utf-8');
  return out;
}
