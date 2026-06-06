import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApplicationRef, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TerminalComponent } from './terminal.component';
import { NavigationService } from '@core/services/navigation.service';
import { BlogService } from '@core/services/blog.service';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { SkillsDataService } from '@core/services/skills-data.service';
import { ThemeService } from '@core/services/theme.service';
import { ProfileDataService } from '@core/services/profile-data.service';
import { THEME_REGISTRY } from '@core/services/theme.registry';
import type { TerminalLine } from './terminal-commands';

const SIDEBAR = [
  { type: 'link' as const, label: 'About', route: '/about', icon: 'user', ext: '.md' },
  { type: 'link' as const, label: 'Projects', route: '/projects', icon: 'folder-git', ext: '.git' },
];

const setThemeSpy = vi.fn();

describe('TerminalComponent', () => {
  let fixture: ComponentFixture<TerminalComponent>;
  let component: TerminalComponent;
  let router: Router;

  beforeEach(async () => {
    setThemeSpy.mockClear();
    await TestBed.configureTestingModule({
      imports: [TerminalComponent],
      providers: [
        provideRouter([]),
        { provide: NavigationService, useValue: { sidebarItems: SIDEBAR } },
        { provide: BlogService, useValue: { posts: signal([]) } },
        { provide: ProjectsDataService, useValue: { projects: signal([]) } },
        { provide: SkillsDataService, useValue: { categories: signal([]) } },
        { provide: ThemeService, useValue: { registry: THEME_REGISTRY, setTheme: setThemeSpy } },
        {
          provide: ProfileDataService,
          useValue: { personalInfo: () => ({ name: 'Faisal Khan', title: 'Engineer' }) },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(TerminalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  function inner(): {
    open: () => boolean;
    draft: () => string;
    lines: () => TerminalLine[];
    onInput: (v: string) => void;
    onKey: (e: KeyboardEvent) => void;
  } {
    return component as unknown as ReturnType<typeof inner>;
  }

  function run(line: string) {
    inner().onInput(line);
    inner().onKey(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
  }

  it('starts closed and opens on Ctrl+`', () => {
    expect(inner().open()).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', ctrlKey: true }));
    expect(inner().open()).toBe(true);
  });

  it('renders the scrollback as a polite log live region', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', ctrlKey: true }));
    fixture.detectChanges();
    const log = fixture.nativeElement.querySelector('[role="log"]');
    expect(log).toBeTruthy();
    expect(log.getAttribute('aria-live')).toBe('polite');
  });

  it('echoes the command and prints help output', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', ctrlKey: true }));
    run('help');
    const texts = inner()
      .lines()
      .map((l) => l.text);
    expect(texts).toContain('$ help');
    expect(texts.some((t) => t.includes('open'))).toBe(true);
    expect(inner().draft()).toBe('');
  });

  it('`open about` navigates and closes the terminal', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', ctrlKey: true }));
    run('open about');
    expect(router.navigate).toHaveBeenCalledWith(['/about']);
    expect(inner().open()).toBe(false);
  });

  it('`theme nord` delegates to ThemeService.setTheme', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', ctrlKey: true }));
    run('theme nord');
    expect(setThemeSpy).toHaveBeenCalledWith('nord');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('`clear` empties the scrollback', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', ctrlKey: true }));
    run('help');
    expect(inner().lines().length).toBeGreaterThan(1);
    run('clear');
    expect(inner().lines().length).toBe(0);
  });

  it('an unknown command prints a not-found error', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', ctrlKey: true }));
    run('frobnicate');
    const last = inner().lines().at(-1);
    expect(last?.kind).toBe('error');
    expect(last?.text).toContain('command not found');
  });

  it('restores focus to the trigger on close', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    try {
      trigger.focus();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', ctrlKey: true }));
      await new Promise<void>((r) => queueMicrotask(() => r()));
      expect(document.activeElement).not.toBe(trigger);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', ctrlKey: true })); // toggle close
      await new Promise<void>((r) => queueMicrotask(() => r()));
      expect(document.activeElement).toBe(trigger);
    } finally {
      trigger.remove();
    }
  });
});
