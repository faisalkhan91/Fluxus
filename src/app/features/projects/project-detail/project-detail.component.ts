import { Component, inject, computed, effect, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { GithubMetaComponent } from '@ui/github-meta/github-meta.component';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { SkillUsageService } from '@core/services/skill-usage.service';
import { SeoService } from '@core/services/seo.service';
import type { Project } from '@shared/models/project.model';
import type { BlogPost } from '@shared/models/blog-post.model';
import { slugify } from '@shared/utils/string.utils';
import { environment } from '@env/environment';
import { projectUrl } from '@shared/utils/url.utils';

/**
 * `/projects/:slug` — per-project detail page.
 *
 * Acts as the richer sibling of `/projects/tag/:tag`: same breadcrumb
 * and dynamic-meta shape, but renders a single project's full
 * GithubMeta block (stars, forks, language, license, last-pushed),
 * README excerpt, 52-week commit sparkline, deep links back to
 * `/skills#skill-<slug>` for any tag that matches a known skill, and
 * blog posts tagged the same way (matched directly against `BlogService`).
 *
 * The slug lookup is permissive: we match by the service-derived slug
 * first, then fall back to `slugify(title)` so a hand-crafted URL from
 * a prior state still resolves. Missing matches render a "not found"
 * hint rather than 404ing — the route is prerendered for every known
 * slug, so a miss here is an authoring error, not a visitor typo.
 */
@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css',
  imports: [
    GlassCardComponent,
    IconComponent,
    SectionHeaderComponent,
    GithubMetaComponent,
    RouterLink,
    NgOptimizedImage,
  ],
})
export class ProjectDetailComponent {
  private route = inject(ActivatedRoute);
  protected projectsData = inject(ProjectsDataService);
  private skillUsage = inject(SkillUsageService);
  private seo = inject(SeoService);

  protected slugify = slugify;

  protected readonly slugParam = toSignal(
    this.route.paramMap.pipe(map((p) => (p.get('slug') ?? '').toLowerCase())),
    { initialValue: '' },
  );

  /**
   * Matching project, or `undefined` when the slug doesn't resolve.
   * The template branches on this to either render the hero block or
   * the "not found" card.
   */
  readonly project = computed<Project | undefined>(() => {
    const slug = this.slugParam();
    if (!slug) return undefined;
    for (const p of this.projectsData.projects()) {
      if (p.slug === slug) return p;
      if (slugify(p.title) === slug) return p;
    }
    return undefined;
  });

  /**
   * The subset of `project.tags` that correspond to a skill known to
   * `SkillsDataService`. Rendered as "Skills used" chips that deep-link
   * to `/skills#skill-<slug>`. Matching uses slugify on both sides plus
   * aliases so a tag like "HTML" resolves to the "HTML5" skill badge.
   */
  readonly skillTags = computed<string[]>(() => {
    const p = this.project();
    if (!p) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const tag of p.tags) {
      const slug = slugify(tag);
      if (!slug || !this.skillUsage.isKnownSkillSlug(slug)) continue;
      const canonical = this.skillUsage.canonicalSkillSlug(slug);
      if (seen.has(canonical)) continue;
      seen.add(canonical);
      out.push(tag);
    }
    return out;
  });

  readonly skillAnchor = (tag: string): string =>
    // Fold aliases back to the canonical skill so the anchor lands on the
    // rendered badge id (see skills.component.html), even when the project
    // tagged the alias spelling.
    `/skills#skill-${this.skillUsage.canonicalSkillSlug(slugify(tag))}`;

  /**
   * Blog posts that share at least one tag with this project. Delegates to
   * `SkillUsageService` so the one tag→post matching path is reused rather
   * than re-implemented here. De-duplicated; ordered by `BlogService.posts()`.
   */
  readonly relatedPosts = computed<BlogPost[]>(() => {
    const p = this.project();
    if (!p) return [];
    return this.skillUsage.postsForTagSlugs(p.tags.map((tag) => slugify(tag)));
  });

  /**
   * Builds the inline-SVG sparkline path from the 52-week commit
   * series. Returns `null` when the series is missing or flat (all
   * zeros — emits a degenerate path that renders as a line and reads
   * as "no activity", which is less informative than hiding the
   * sparkline entirely).
   */
  readonly sparklinePath = computed<string | null>(() => {
    const series = this.project()?.github?.commitsPerWeek;
    if (!series || series.length === 0) return null;
    const max = series.reduce((a, b) => Math.max(a, b), 0);
    if (max === 0) return null;
    const width = 100;
    const height = 20;
    const dx = series.length > 1 ? width / (series.length - 1) : 0;
    const points = series.map((v, i) => {
      const x = i * dx;
      const y = height - (v / max) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return points.join(' ');
  });

  readonly sparklineTotal = computed<number>(() => {
    const series = this.project()?.github?.commitsPerWeek;
    if (!series) return 0;
    return series.reduce((a, b) => a + b, 0);
  });

  constructor() {
    effect(() => {
      const p = this.project();
      const slug = this.slugParam();
      untracked(() => {
        if (p) {
          this.updateMetaTags(p);
        } else if (slug) {
          // Bad slug (typo'd URL or removed project). Mark the page
          // noindex,nofollow so the "not found" chrome doesn't compete
          // with the real prerendered project pages in the index, and
          // give the page a meaningful title so the browser tab and
          // crawler logs still convey *what* failed. The empty-slug
          // case isn't reachable through the route's `:slug` matcher
          // but we guard anyway.
          this.seo.setRobots('noindex,nofollow');
          this.seo.updateDynamicMeta({
            title: `Project not found — ${environment.siteName}`,
            description: 'The project you are looking for does not exist.',
            url: projectUrl(slug),
            type: 'website',
          });
        }
      });
    });
  }

  private updateMetaTags(project: Project): void {
    const slug = project.slug ?? slugify(project.title);
    const url = projectUrl(slug);
    const title = `${project.title} — ${environment.siteName}`;
    const description = project.github?.readmeExcerpt ?? project.description;
    const image = `${environment.siteUrl}/${project.image.replace(/^\/+/, '')}`;

    this.seo.updateDynamicMeta({ title, description, url, type: 'article', image });
    this.seo.setCanonical(url);
  }
}
