import { describe, it, expect, vi } from 'vitest';
import {
  parseInput,
  executeCommand,
  matchTarget,
  completeVerb,
  type TerminalContext,
  type TerminalLine,
  type TerminalTargets,
} from './terminal-commands';

const TARGETS: TerminalTargets = {
  pages: [
    { label: 'About', route: '/about' },
    { label: 'Projects', route: '/projects' },
    { label: 'Contact', route: '/contact' },
  ],
  posts: [{ title: 'Taming State with Angular Signals', route: '/blog/angular-signals' }],
  projects: [{ title: 'Image Generator', route: '/projects/image-generator' }],
  skills: ['Rust', 'TypeScript'],
  themes: [
    { id: 'crimson-dark', label: 'Crimson Dark' },
    { id: 'tokyo-night', label: 'Tokyo Night' },
    { id: 'nord', label: 'Nord' },
  ],
};

function makeCtx(overrides: Partial<TerminalContext> = {}) {
  const lines: TerminalLine[] = [];
  const ctx: TerminalContext = {
    print: (text, kind = 'output') => lines.push({ text, kind }),
    clear: vi.fn(),
    close: vi.fn(),
    navigate: vi.fn(),
    setTheme: vi.fn().mockReturnValue(true),
    openResume: vi.fn(),
    identity: { name: 'Faisal Khan', role: 'Senior Software Engineer' },
    targets: TARGETS,
    ...overrides,
  };
  return { ctx, lines };
}

describe('parseInput', () => {
  it('returns null for blank input', () => {
    expect(parseInput('   ')).toBeNull();
    expect(parseInput('')).toBeNull();
  });
  it('lowercases the verb and keeps args', () => {
    expect(parseInput('OPEN  About Me')).toEqual({ name: 'open', args: ['About', 'Me'] });
  });
});

describe('matchTarget', () => {
  it('matches a page by label (case-insensitive)', () => {
    expect(matchTarget('about', TARGETS)).toBe('/about');
    expect(matchTarget('ABOUT', TARGETS)).toBe('/about');
  });
  it('matches a page by route', () => {
    expect(matchTarget('/projects', TARGETS)).toBe('/projects');
  });
  it('matches a post by title substring', () => {
    expect(matchTarget('signals', TARGETS)).toBe('/blog/angular-signals');
  });
  it('matches a project', () => {
    expect(matchTarget('image gen', TARGETS)).toBe('/projects/image-generator');
  });
  it('returns null for no match', () => {
    expect(matchTarget('nope-zzz', TARGETS)).toBeNull();
  });
  it('prefers pages over posts/projects on an exact hit', () => {
    expect(matchTarget('contact', TARGETS)).toBe('/contact');
  });
});

describe('executeCommand', () => {
  it('errors on an unknown command', () => {
    const { ctx, lines } = makeCtx();
    executeCommand(ctx, 'frobnicate now');
    expect(lines.at(-1)).toEqual({
      kind: 'error',
      text: "command not found: frobnicate — type 'help'",
    });
  });

  it('help lists every command', () => {
    const { ctx, lines } = makeCtx();
    executeCommand(ctx, 'help');
    const text = lines.map((l) => l.text).join('\n');
    expect(text).toContain('open');
    expect(text).toContain('theme');
    expect(text).toContain('ls');
  });

  it('ls lists pages by default and a named section', () => {
    const { ctx, lines } = makeCtx();
    executeCommand(ctx, 'ls');
    expect(lines.some((l) => l.text.includes('/about'))).toBe(true);
    lines.length = 0;
    executeCommand(ctx, 'ls themes');
    expect(lines.some((l) => l.text.includes('tokyo-night'))).toBe(true);
  });

  it('ls errors on an unknown section', () => {
    const { ctx, lines } = makeCtx();
    executeCommand(ctx, 'ls bananas');
    expect(lines.at(-1)?.kind).toBe('error');
  });

  it('open navigates to a matched target', () => {
    const { ctx } = makeCtx();
    executeCommand(ctx, 'open about');
    expect(ctx.navigate).toHaveBeenCalledWith('/about');
  });

  it('open with no args prints usage', () => {
    const { ctx, lines } = makeCtx();
    executeCommand(ctx, 'open');
    expect(lines.at(-1)?.kind).toBe('error');
    expect(ctx.navigate).not.toHaveBeenCalled();
  });

  it('cd / go / cat are aliases of open', () => {
    for (const verb of ['cd', 'go', 'cat']) {
      const { ctx } = makeCtx();
      executeCommand(ctx, `${verb} projects`);
      expect(ctx.navigate).toHaveBeenCalledWith('/projects');
    }
  });

  it('theme with no args lists themes', () => {
    const { ctx, lines } = makeCtx();
    executeCommand(ctx, 'theme');
    expect(lines.some((l) => l.text.includes('Tokyo Night'))).toBe(true);
  });

  it('theme <name> switches by id or label', () => {
    const { ctx } = makeCtx();
    executeCommand(ctx, 'theme nord');
    expect(ctx.setTheme).toHaveBeenCalledWith('nord');
  });

  it('theme errors on an unknown name', () => {
    const { ctx, lines } = makeCtx({ setTheme: vi.fn().mockReturnValue(false) });
    executeCommand(ctx, 'theme chartreuse');
    expect(lines.at(-1)?.kind).toBe('error');
  });

  it('resume opens the pdf, clear/exit delegate', () => {
    const { ctx } = makeCtx();
    executeCommand(ctx, 'resume');
    expect(ctx.openResume).toHaveBeenCalled();
    executeCommand(ctx, 'clear');
    expect(ctx.clear).toHaveBeenCalled();
    executeCommand(ctx, 'exit');
    expect(ctx.close).toHaveBeenCalled();
  });

  it('whoami prints the identity', () => {
    const { ctx, lines } = makeCtx();
    executeCommand(ctx, 'whoami');
    expect(lines.at(-1)?.text).toContain('Faisal Khan');
  });
});

describe('completeVerb', () => {
  it('completes a unique prefix', () => {
    expect(completeVerb('wh')).toBe('whoami');
  });
  it('returns null when ambiguous or empty', () => {
    expect(completeVerb('c')).toBeNull(); // cd, cat, contact, clear, close, cls, cv …
    expect(completeVerb('')).toBeNull();
  });
});
