import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  effect,
  untracked,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { SeoService } from '@core/services/seo.service';
import { slugify } from '@shared/utils/string.utils';
import { environment } from '@env/environment';
import { projectTagUrl } from '@shared/utils/url.utils';

/**
 * `/projects/tag/:tag` — projects archive filtered by a single tag slug.
 *
 * Mirrors `BlogTagComponent` so URL shapes (`/blog/tag/:tag`,
 * `/projects/tag/:tag`), breadcrumb layouts, dynamic head tags, and the
 * "no matches" empty state behave identically across the two surfaces.
 *
 * Route data sets `seo: { dynamicMeta: true }` so `SeoService` skips the
 * route and we own `<title>`, OG/Twitter, description, and `<link
 * rel="canonical">` here. `inject-meta.mjs` writes the same shape into
 * the prerendered HTML at build time.
 */
@Component({
  selector: 'app-projects-tag',
  templateUrl: './projects-tag.component.html',
  styleUrl: './projects-tag.component.css',
  imports: [
    GlassCardComponent,
    IconComponent,
    SectionHeaderComponent,
    RouterLink,
    NgOptimizedImage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsTagComponent {
  private route = inject(ActivatedRoute);
  protected projectsData = inject(ProjectsDataService);
  private seo = inject(SeoService);

  protected readonly tagSlug = toSignal(
    this.route.paramMap.pipe(map((p) => (p.get('tag') ?? '').toLowerCase())),
    { initialValue: '' },
  );

  /**
   * Display label = the first matching project's tag spelling. Mirrors
   * the BlogTag behaviour so users see "CI/CD" rather than "ci-cd" in
   * the heading even when arriving via a slugified URL.
   */
  readonly tagLabel = computed(() => {
    const slug = this.tagSlug();
    if (!slug) return '';
    for (const project of this.projectsData.projects()) {
      const match = project.tags.find((t) => slugify(t) === slug);
      if (match) return match;
    }
    return slug;
  });

  readonly matchingProjects = computed(() => {
    const slug = this.tagSlug();
    if (!slug) return [];
    return this.projectsData.projects().filter((p) => p.tags.some((t) => slugify(t) === slug));
  });

  /**
   * Per-card "expanded" set, identical to the parent ProjectsComponent so
   * the cards behave the same way (clamp at 3 lines, "Read more" reveals
   * the rest). A `Set<string>` keyed by title is fine here — no projects
   * share titles.
   */
  private readonly expandedSet = signal(new Set<string>());

  protected isExpanded(title: string): boolean {
    return this.expandedSet().has(title);
  }

  protected toggleExpand(title: string): void {
    this.expandedSet.update((set) => {
      const next = new Set(set);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  protected slugify = slugify;

  constructor() {
    effect(() => {
      const slug = this.tagSlug();
      const label = this.tagLabel();
      if (!slug || !label) return;
      untracked(() => this.updateMetaTags({ slug, label }));
    });
  }

  /**
   * Named-args shape so the slug and label can never be swapped at the
   * call site — both are plain strings, and a positional
   * `updateMetaTags(label, slug)` mistake would compile cleanly while
   * producing a wrong canonical URL like `/projects/tag/TypeScript`.
   */
  private updateMetaTags({ slug, label }: { slug: string; label: string }): void {
    const url = projectTagUrl(slug);
    const title = `Projects tagged "${label}" - ${environment.siteName}`;
    const description = `Every project in Faisal Khan's portfolio tagged with "${label}".`;

    this.seo.updateDynamicMeta({ title, description, url, type: 'website' });
    this.seo.setCanonical(url);
  }
}
