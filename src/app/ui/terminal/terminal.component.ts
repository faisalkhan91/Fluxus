import type { ElementRef } from '@angular/core';
import {
  Component,
  inject,
  signal,
  effect,
  viewChild,
  PLATFORM_ID,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { HotkeyService } from '@core/services/hotkey.service';
import { NavigationService } from '@core/services/navigation.service';
import { BlogService } from '@core/services/blog.service';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { SkillsDataService } from '@core/services/skills-data.service';
import { ThemeService } from '@core/services/theme.service';
import { ProfileDataService } from '@core/services/profile-data.service';
import { isThemeId } from '@core/services/theme.registry';
import { slugify } from '@shared/utils/string.utils';
import {
  executeCommand,
  completeVerb,
  type TerminalContext,
  type TerminalLine,
  type TerminalTargets,
} from './terminal-commands';

const OVERLAY_ID = 'terminal';

/**
 * Terminal-mode overlay — a VS-Code-style integrated console (Ctrl+`) where
 * users type `ls`, `open <thing>`, `theme <name>`, `resume`, `help`, etc.
 * Mirrors the command-palette's native-`<dialog>` mechanics (focus trap, Esc,
 * backdrop, focus restore) and routes its open/close through the shared
 * HotkeyService. Command logic lives in the pure `terminal-commands.ts`.
 */
@Component({
  selector: 'ui-terminal',
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
  imports: [IconComponent],
})
export class TerminalComponent {
  private router = inject(Router);
  private hotkeys = inject(HotkeyService);
  private nav = inject(NavigationService);
  private blog = inject(BlogService);
  private projectsData = inject(ProjectsDataService);
  private skills = inject(SkillsDataService);
  private theme = inject(ThemeService);
  private profile = inject(ProfileDataService);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly input = viewChild<ElementRef<HTMLInputElement>>('input');
  protected readonly scrollback = viewChild<ElementRef<HTMLElement>>('scrollback');

  protected readonly open = signal(false);
  protected readonly draft = signal('');
  protected readonly lines = signal<TerminalLine[]>([]);

  /** Input history (most-recent last) + a cursor walked by ArrowUp/Down. */
  private history: string[] = [];
  private historyIndex = 0;
  private previouslyFocused: HTMLElement | null = null;

  private readonly intro: TerminalLine[] = [
    { kind: 'output', text: "fluxus terminal — type 'help' for commands, 'exit' to close." },
  ];

  constructor() {
    this.destroyRef.onDestroy(
      this.hotkeys.register({
        id: OVERLAY_ID,
        label: 'Open terminal',
        group: 'General',
        keys: ['Ctrl', '`'],
        combo: { key: '`', ctrl: true },
        allowInInput: true,
        handler: () => this.toggle(),
      }),
    );
    this.destroyRef.onDestroy(
      this.hotkeys.register({
        id: 'terminal:close',
        label: 'Close',
        group: 'General',
        keys: ['Esc'],
        combo: { key: 'Escape' },
        allowInInput: true,
        when: () => this.open(),
        handler: () => this.close(),
        hidden: true,
      }),
    );

    effect(() => {
      if (this.hotkeys.activeOverlay() !== OVERLAY_ID && this.open()) {
        this.close();
      }
    });
  }

  protected toggle(): void {
    if (this.open()) this.close();
    else this.openTerminal();
  }

  private openTerminal(): void {
    this.captureFocus();
    this.hotkeys.activeOverlay.set(OVERLAY_ID);
    if (this.lines().length === 0) this.lines.set([...this.intro]);
    this.open.set(true);
    this.historyIndex = this.history.length;
    queueMicrotask(() => {
      this.dialog()?.nativeElement.showModal?.();
      this.input()?.nativeElement.focus();
    });
  }

  protected close(): void {
    this.dialog()?.nativeElement.close?.();
    this.open.set(false);
    if (this.hotkeys.activeOverlay() === OVERLAY_ID) this.hotkeys.activeOverlay.set(null);
    this.restoreFocus();
  }

  protected onInput(value: string): void {
    this.draft.set(value);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submit();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.recallHistory(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.recallHistory(1);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this.autocomplete();
    }
  }

  private submit(): void {
    const raw = this.draft();
    if (!raw.trim()) {
      this.draft.set('');
      return;
    }
    this.print(`$ ${raw}`, 'command');
    this.history.push(raw);
    this.historyIndex = this.history.length;
    executeCommand(this.context(), raw);
    this.draft.set('');
    this.scrollToBottom();
  }

  private recallHistory(direction: -1 | 1): void {
    if (this.history.length === 0) return;
    const next = Math.min(this.history.length, Math.max(0, this.historyIndex + direction));
    this.historyIndex = next;
    this.draft.set(next === this.history.length ? '' : this.history[next]);
  }

  /** Tab-complete the first token (the command verb) when it's unambiguous. */
  private autocomplete(): void {
    const value = this.draft();
    if (value.includes(' ')) return; // only complete the leading verb
    const completed = completeVerb(value);
    if (completed) this.draft.set(completed + ' ');
  }

  private print(text: string, kind: TerminalLine['kind'] = 'output'): void {
    this.lines.update((list) => [...list, { kind, text }]);
  }

  private scrollToBottom(): void {
    if (!this.isBrowser) return;
    queueMicrotask(() => {
      const el = this.scrollback()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  /** Build the command context from the live services on each invocation. */
  private context(): TerminalContext {
    return {
      print: (text, kind) => this.print(text, kind),
      clear: () => this.lines.set([]),
      close: () => this.close(),
      navigate: (route) => {
        // Let the shell's NavigationEnd handler own focus on the new route.
        this.previouslyFocused = null;
        this.close();
        this.router.navigate([route]);
      },
      setTheme: (id) => {
        if (!isThemeId(id)) return false;
        this.theme.setTheme(id);
        return true;
      },
      openResume: () => {
        if (this.isBrowser) window.open('assets/resume.pdf', '_blank');
      },
      identity: {
        name: this.profile.personalInfo().name,
        role: this.profile.personalInfo().title,
      },
      targets: this.targets(),
    };
  }

  private targets(): TerminalTargets {
    return {
      pages: this.nav.sidebarItems
        .filter((item) => item.type === 'link')
        .map((item) => ({ label: item.label, route: item.route })),
      posts: this.blog.posts().map((p) => ({ title: p.title, route: `/blog/${p.slug}` })),
      projects: this.projectsData.projects().map((p) => {
        const slug = p.slug ?? slugify(p.title);
        return { title: p.title, route: `/projects/${slug}` };
      }),
      skills: this.skills.categories().flatMap((c) => c.skills.map((s) => s.name)),
      themes: this.theme.registry.map((t) => ({ id: t.id, label: t.label })),
    };
  }

  private captureFocus(): void {
    if (!this.isBrowser) return;
    const active = document.activeElement;
    this.previouslyFocused =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }

  private restoreFocus(): void {
    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    if (!target?.isConnected || typeof target.focus !== 'function') return;
    queueMicrotask(() => target.focus());
  }
}
