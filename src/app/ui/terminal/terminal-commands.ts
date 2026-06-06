/**
 * Pure command layer for the terminal overlay. No Angular, no DOM — just
 * parsing + a registry of verbs that operate through an injected
 * {@link TerminalContext}. Kept side-effect-free so every command (and the
 * fuzzy target matching) is unit-testable with a plain mock context.
 */

export type TerminalLineKind = 'command' | 'output' | 'error' | 'success';

export interface TerminalLine {
  kind: TerminalLineKind;
  text: string;
}

/** Navigable / switchable targets the component feeds in from the real services. */
export interface TerminalTargets {
  /** Top-level pages: `{ label: 'About', route: '/about' }`. */
  pages: { label: string; route: string }[];
  posts: { title: string; route: string }[];
  projects: { title: string; route: string }[];
  skills: string[];
  themes: { id: string; label: string }[];
}

export interface TerminalContext {
  print(text: string, kind?: TerminalLineKind): void;
  clear(): void;
  close(): void;
  /** Navigate to a route and dismiss the terminal. */
  navigate(route: string): void;
  /** Apply a theme by id; returns false if the id isn't a registered theme. */
  setTheme(id: string): boolean;
  openResume(): void;
  identity: { name: string; role: string };
  targets: TerminalTargets;
}

export interface TerminalCommand {
  name: string;
  aliases?: string[];
  describe: string;
  usage?: string;
  run(ctx: TerminalContext, args: string[]): void;
}

/** Normalize for matching: lowercase + collapse whitespace. */
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Resolve a free-text target to a route across pages, posts, and projects
 * (in that priority order). Tries exact label/route, then prefix, then
 * substring. Returns null when nothing matches.
 */
export function matchTarget(query: string, targets: TerminalTargets): string | null {
  const q = norm(query);
  if (!q) return null;
  const pool: { key: string; route: string }[] = [
    ...targets.pages.map((p) => ({ key: norm(p.label), route: p.route })),
    ...targets.pages.map((p) => ({ key: norm(p.route), route: p.route })),
    ...targets.posts.map((p) => ({ key: norm(p.title), route: p.route })),
    ...targets.projects.map((p) => ({ key: norm(p.title), route: p.route })),
  ];
  return (
    pool.find((c) => c.key === q)?.route ??
    pool.find((c) => c.key.startsWith(q))?.route ??
    pool.find((c) => c.key.includes(q))?.route ??
    null
  );
}

const NAVIGATE: TerminalCommand = {
  name: 'open',
  aliases: ['cd', 'go', 'cat'],
  describe: 'Go to a page, post, or project',
  usage: 'open <page|post|project>',
  run(ctx, args) {
    if (args.length === 0) {
      ctx.print('usage: open <page|post|project>  —  try `ls` to see targets', 'error');
      return;
    }
    const query = args.join(' ');
    const route = matchTarget(query, ctx.targets);
    if (!route) {
      ctx.print(`not found: ${query}  —  try \`ls\` to list pages, posts, projects`, 'error');
      return;
    }
    ctx.print(`navigating → ${route}`, 'success');
    ctx.navigate(route);
  },
};

const LS: TerminalCommand = {
  name: 'ls',
  describe: 'List pages, blog posts, projects, skills, or themes',
  usage: 'ls [pages|blog|projects|skills|themes]',
  run(ctx, args) {
    const section = norm(args[0] ?? 'pages');
    const t = ctx.targets;
    switch (section) {
      case '':
      case 'pages':
        for (const p of t.pages) ctx.print(`${p.route.padEnd(18)} ${p.label}`);
        return;
      case 'blog':
      case 'posts':
        if (!t.posts.length) ctx.print('(no posts)');
        for (const p of t.posts) ctx.print(`${p.route.padEnd(28)} ${p.title}`);
        return;
      case 'projects':
        for (const p of t.projects) ctx.print(`${p.route.padEnd(28)} ${p.title}`);
        return;
      case 'skills':
        ctx.print(t.skills.join(', ') || '(none)');
        return;
      case 'themes':
        for (const th of t.themes) ctx.print(`${th.id.padEnd(18)} ${th.label}`);
        return;
      default:
        ctx.print(
          `ls: unknown section '${section}' — try pages|blog|projects|skills|themes`,
          'error',
        );
    }
  },
};

const THEME: TerminalCommand = {
  name: 'theme',
  describe: 'List themes, or switch with `theme <name>`',
  usage: 'theme [name]',
  run(ctx, args) {
    if (args.length === 0) {
      for (const th of ctx.targets.themes) ctx.print(`${th.id.padEnd(18)} ${th.label}`);
      ctx.print('switch with: theme <name>');
      return;
    }
    const q = norm(args.join(' '));
    const match =
      ctx.targets.themes.find((th) => norm(th.id) === q || norm(th.label) === q) ??
      ctx.targets.themes.find((th) => norm(th.id).includes(q) || norm(th.label).includes(q));
    if (!match || !ctx.setTheme(match.id)) {
      ctx.print(`unknown theme: ${args.join(' ')} — try \`theme\` to list`, 'error');
      return;
    }
    ctx.print(`theme → ${match.label}`, 'success');
  },
};

const RESUME: TerminalCommand = {
  name: 'resume',
  aliases: ['cv'],
  describe: 'Open the résumé PDF',
  run(ctx) {
    ctx.openResume();
    ctx.print('opening résumé…', 'success');
  },
};

const CONTACT: TerminalCommand = {
  name: 'contact',
  aliases: ['email'],
  describe: 'Jump to the contact page',
  run(ctx) {
    ctx.navigate('/contact');
  },
};

const WHOAMI: TerminalCommand = {
  name: 'whoami',
  describe: 'Print the operator',
  run(ctx) {
    ctx.print(`${ctx.identity.name} — ${ctx.identity.role}`, 'output');
  },
};

const CLEAR: TerminalCommand = {
  name: 'clear',
  aliases: ['cls'],
  describe: 'Clear the screen',
  run(ctx) {
    ctx.clear();
  },
};

const EXIT: TerminalCommand = {
  name: 'exit',
  aliases: ['close', 'q', 'quit'],
  describe: 'Close the terminal',
  run(ctx) {
    ctx.close();
  },
};

const HELP: TerminalCommand = {
  name: 'help',
  aliases: ['?', 'man'],
  describe: 'Show this help',
  run(ctx) {
    ctx.print('Available commands:', 'output');
    for (const c of COMMANDS) {
      const names = [c.name, ...(c.aliases ?? [])].join(', ');
      ctx.print(`  ${names.padEnd(22)} ${c.describe}`);
    }
    ctx.print("Tip: press '?' anywhere for the keyboard-shortcuts overlay.");
  },
};

export const COMMANDS: TerminalCommand[] = [
  HELP,
  LS,
  NAVIGATE,
  THEME,
  RESUME,
  CONTACT,
  WHOAMI,
  CLEAR,
  EXIT,
];

/** name/alias → command lookup. */
const BY_NAME = new Map<string, TerminalCommand>();
for (const c of COMMANDS) {
  BY_NAME.set(c.name, c);
  for (const a of c.aliases ?? []) BY_NAME.set(a, c);
}

/** All command verbs + aliases, for Tab completion. */
export const COMMAND_NAMES: string[] = [...BY_NAME.keys()].sort();

export interface ParsedCommand {
  name: string;
  args: string[];
}

/** Split a raw input line into a command name + args. Returns null when blank. */
export function parseInput(raw: string): ParsedCommand | null {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return { name: parts[0].toLowerCase(), args: parts.slice(1) };
}

/**
 * Execute a raw input line against the context. The caller is responsible for
 * echoing the prompt line; this only produces command output (or the
 * not-found error).
 */
export function executeCommand(ctx: TerminalContext, raw: string): void {
  const parsed = parseInput(raw);
  if (!parsed) return;
  const command = BY_NAME.get(parsed.name);
  if (!command) {
    ctx.print(`command not found: ${parsed.name} — type 'help'`, 'error');
    return;
  }
  command.run(ctx, parsed.args);
}

/** Tab-completion: the longest unique verb that starts with the current token. */
export function completeVerb(token: string): string | null {
  const t = token.toLowerCase();
  if (!t) return null;
  const hits = COMMAND_NAMES.filter((n) => n.startsWith(t));
  if (hits.length === 1) return hits[0];
  return null;
}
