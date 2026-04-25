export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    // Strip leading/trailing dashes so emoji-prefixed headings like
    // "⚠️ The SMR Trap" don't yield ids like "-the-smr-trap".
    .replace(/^-+|-+$/g, '');
}
