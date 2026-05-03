import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GithubMetaComponent } from './github-meta.component';
import { GithubMeta } from '@shared/models/project.model';

function baseMeta(overrides: Partial<GithubMeta> = {}): GithubMeta {
  return {
    stars: 10,
    forks: 3,
    primaryLanguage: 'TypeScript',
    languageColor: '#3178c6',
    pushedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    license: 'MIT',
    topics: [],
    archived: false,
    openIssues: 2,
    homepage: null,
    languagesBytes: [],
    latestRelease: null,
    readmeExcerpt: null,
    commitsPerWeek: null,
    fetchedAt: '2026-05-03T00:00:00Z',
    ...overrides,
  };
}

async function mount(
  meta: GithubMeta | undefined,
  opts: { projectTitle?: string; showOpenIssues?: boolean } = {},
): Promise<ComponentFixture<GithubMetaComponent>> {
  await TestBed.configureTestingModule({
    imports: [GithubMetaComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
  }).compileComponents();
  const fixture = TestBed.createComponent(GithubMetaComponent);
  fixture.componentRef.setInput('meta', meta);
  fixture.componentRef.setInput('projectTitle', opts.projectTitle ?? 'Test');
  fixture.componentRef.setInput('showOpenIssues', opts.showOpenIssues ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('GithubMetaComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders nothing when meta() is undefined', async () => {
    const fixture = await mount(undefined);
    expect(fixture.nativeElement.querySelector('.gh-pill-row')).toBeNull();
    expect(fixture.nativeElement.querySelector('.gh-languages-bar')).toBeNull();
  });

  it('emits the full meta row when all fields are populated', async () => {
    const fixture = await mount(
      baseMeta({
        homepage: 'https://example.com',
        latestRelease: { tag: 'v1.2.3', publishedAt: '2026-04-01T00:00:00Z' },
        languagesBytes: [
          { name: 'TypeScript', color: '#3178c6', bytes: 8000 },
          { name: 'HTML', color: '#e34c26', bytes: 2000 },
        ],
      }),
      { projectTitle: 'Alpha' },
    );
    const pills = Array.from(
      fixture.nativeElement.querySelectorAll('.gh-pill') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim().replace(/\s+/g, ' ') ?? '');
    const joined = pills.join(' | ');
    expect(joined).toContain('TypeScript');
    expect(joined).toContain('v1.2.3');
    expect(joined).toContain('Live demo');
    expect(joined).toContain('10'); // stars
    expect(joined).toContain('3'); // forks
    expect(joined).toContain('3d ago');
    expect(joined).toContain('MIT');
  });

  it('hides the open-issues pill unless showOpenIssues is true', async () => {
    const fixture = await mount(baseMeta({ openIssues: 7 }));
    const issuesPill = Array.from(
      fixture.nativeElement.querySelectorAll('.gh-pill') as NodeListOf<HTMLElement>,
    ).find((el) => el.getAttribute('aria-label')?.includes('open issues'));
    expect(issuesPill).toBeUndefined();
  });

  it('shows the open-issues pill when showOpenIssues is true and count > 0', async () => {
    const fixture = await mount(baseMeta({ openIssues: 7 }), { showOpenIssues: true });
    const issuesPill = Array.from(
      fixture.nativeElement.querySelectorAll('.gh-pill') as NodeListOf<HTMLElement>,
    ).find((el) => el.getAttribute('aria-label')?.includes('open issues'));
    expect(issuesPill).toBeDefined();
    expect(issuesPill?.textContent).toContain('7');
  });

  it('suppresses the open-issues pill on archived repos even when showOpenIssues is true', async () => {
    const fixture = await mount(baseMeta({ openIssues: 7, archived: true }), {
      showOpenIssues: true,
    });
    const issuesPill = Array.from(
      fixture.nativeElement.querySelectorAll('.gh-pill') as NodeListOf<HTMLElement>,
    ).find((el) => el.getAttribute('aria-label')?.includes('open issues'));
    expect(issuesPill).toBeUndefined();
  });

  it('renders the language distribution bar with one segment per entry', async () => {
    const fixture = await mount(
      baseMeta({
        languagesBytes: [
          { name: 'TypeScript', color: '#3178c6', bytes: 8000 },
          { name: 'HTML', color: '#e34c26', bytes: 2000 },
        ],
      }),
    );
    const bar = fixture.nativeElement.querySelector('.gh-languages-bar') as HTMLElement | null;
    expect(bar).toBeTruthy();
    const segments = bar!.querySelectorAll('.gh-languages-segment');
    expect(segments.length).toBe(2);
    expect(bar!.getAttribute('aria-label')).toContain('TypeScript 80.0%');
    expect(bar!.getAttribute('aria-label')).toContain('HTML 20.0%');
  });

  it('omits the language bar when languagesBytes is empty', async () => {
    const fixture = await mount(baseMeta({ languagesBytes: [] }));
    expect(fixture.nativeElement.querySelector('.gh-languages-bar')).toBeNull();
  });

  it('renders the Live demo pill as a target=_blank anchor', async () => {
    const fixture = await mount(baseMeta({ homepage: 'https://example.com/demo' }));
    const demoLink = fixture.nativeElement.querySelector(
      'a.gh-pill-link',
    ) as HTMLAnchorElement | null;
    expect(demoLink).toBeTruthy();
    expect(demoLink!.getAttribute('href')).toBe('https://example.com/demo');
    expect(demoLink!.getAttribute('target')).toBe('_blank');
    expect(demoLink!.getAttribute('rel')).toBe('noopener');
  });
});
