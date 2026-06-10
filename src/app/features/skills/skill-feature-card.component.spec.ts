import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SkillFeatureCardComponent } from './skill-feature-card.component';

/**
 * Unit coverage for the presentational feature card: conditional rendering of
 * the projects/posts affordances, the link-vs-span choice driven by href, and
 * the singular/plural aria-labels.
 */
describe('SkillFeatureCardComponent', () => {
  let fixture: ComponentFixture<SkillFeatureCardComponent>;

  function setup(inputs: Partial<Record<string, unknown>> = {}) {
    fixture = TestBed.createComponent(SkillFeatureCardComponent);
    fixture.componentRef.setInput('name', 'TypeScript');
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillFeatureCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function text(selector: string): string {
    return (fixture.nativeElement.querySelector(selector)?.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  it('renders the name and only shows the since chip when provided', () => {
    setup();
    expect(text('.feature-name')).toBe('TypeScript');
    expect(fixture.nativeElement.querySelector('.feature-since')).toBeNull();

    setup({ since: 2015 });
    expect(text('.feature-since')).toBe('since 2015');
  });

  it('hides the projects/posts footer counts when both are zero', () => {
    setup({ projectsCount: 0, postsCount: 0 });
    expect(fixture.nativeElement.querySelector('.feature-link')).toBeNull();
    expect(fixture.nativeElement.querySelector('.feature-count')).toBeNull();
  });

  it('renders a routed projects link when href + count are present, with a pluralised aria-label', () => {
    setup({ projectsCount: 3, href: '/projects/tag/typescript' });
    const link = fixture.nativeElement.querySelector('a.feature-link');
    expect(link).not.toBeNull();
    expect(link.getAttribute('aria-label')).toBe('TypeScript — view 3 projects');
    expect(link.textContent).toContain('3 projects');
  });

  it('singularises "project" for a count of one', () => {
    setup({ projectsCount: 1, href: '/projects/tag/typescript' });
    const link = fixture.nativeElement.querySelector('a.feature-link');
    expect(link.getAttribute('aria-label')).toBe('TypeScript — view 1 project');
    expect(link.textContent).toContain('1 project');
  });

  it('falls back to a non-interactive count span when no href is given', () => {
    setup({ projectsCount: 2 });
    expect(fixture.nativeElement.querySelector('a.feature-link')).toBeNull();
    expect(text('.feature-count')).toContain('2 projects');
  });

  it('renders the posts affordance independently with its own pluralisation', () => {
    setup({ postsCount: 1, postsHref: '/blog/tag/typescript' });
    const posts = fixture.nativeElement.querySelector('a.feature-posts');
    expect(posts).not.toBeNull();
    expect(posts.getAttribute('aria-label')).toBe('1 post tagged TypeScript');
    expect(posts.textContent).toContain('1 post');
  });
});
