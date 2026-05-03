import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgOptimizedImage, DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { SkillUsageService } from '@core/services/skill-usage.service';
import { SkillsDataService } from '@core/services/skills-data.service';
import { BlogService } from '@core/services/blog.service';
import { Project } from '@shared/models/project.model';
import { BlogPost } from '@shared/models/blog-post.model';
import { slugify } from '@shared/utils/string.utils';
import { environment } from '@env/environment';

const DEFAULT_OG_IMAGE = `${environment.siteUrl}/assets/images/og-image.png`;

/**
 * `/projects/:slug` — per-project detail page.
 *
 * Acts as the richer sibling of `/projects/tag/:tag`: same breadcrumb
 * and dynamic-meta shape, but renders a single project's full
 * GithubMeta block (stars, forks, language, license, last-pushed),
 * README excerpt, 52-week commit sparkline, deep links back to
 * `/skills#skill-<slug>` for any tag that matches a known skill, and
 * blog posts tagged the same way via `SkillUsageService`.
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
  imports: [GlassCardComponent, IconComponent, SectionHeaderComponent, RouterLink, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent {
  private route = inject(ActivatedRoute);
  protected projectsData = inject(ProjectsDataService);
  private skillUsage = inject(SkillUsageService);
  private skillsData = inject(SkillsDataService);
  private blog = inject(BlogService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private document = inject(DOCUMENT);

  protected slugify = slugify;

  protected slugParam = toSignal(
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
    const skills = this.skillsData.categories().flatMap((c) => c.skills);
    const knownSlugs = new Set<string>();
    const aliasToCanonical = new Map<string, string>();
    for (const s of skills) {
      const canonical = slugify(s.name);
      if (canonical) {
        knownSlugs.add(canonical);
        aliasToCanonical.set(canonical, canonical);
      }
      for (const alias of s.aliases ?? []) {
        const a = slugify(alias);
        if (!a) continue;
        knownSlugs.add(a);
        if (canonical) aliasToCanonical.set(a, canonical);
      }
    }
    const seen = new Set<string>();
    const out: string[] = [];
    for (const tag of p.tags) {
      const slug = slugify(tag);
      if (!slug || !knownSlugs.has(slug)) continue;
      const canonical = aliasToCanonical.get(slug) ?? slug;
      if (seen.has(canonical)) continue;
      seen.add(canonical);
      out.push(tag);
    }
    return out;
  });

  readonly skillAnchor = (tag: string): string => {
    const slug = slugify(tag);
    // Fold aliases back to the canonical skill so the anchor lands on
    // the rendered badge id (see skills.component.html), even when the
    // project tagged the alias spelling.
    const skills = this.skillsData.categories().flatMap((c) => c.skills);
    for (const s of skills) {
      if (slugify(s.name) === slug) return `/skills#skill-${slug}`;
      for (const alias of s.aliases ?? []) {
        if (slugify(alias) === slug) return `/skills#skill-${slugify(s.name)}`;
      }
    }
    return `/skills#skill-${slug}`;
  };

  /**
   * Blog posts that share at least one tag with this project. Uses the
   * skill-usage index as a pre-built `tagSlug → posts[]` map so we don't
   * re-traverse the posts on every render. De-duplicated; ordered by
   * the order posts appear in the `BlogService`.
   */
  readonly relatedPosts = computed<BlogPost[]>(() => {
    const p = this.project();
    if (!p) return [];
    const wanted = new Set<string>();
    for (const tag of p.tags) {
      const slug = slugify(tag);
      if (slug) wanted.add(slug);
    }
    if (wanted.size === 0) return [];
    const matched = new Set<BlogPost>();
    for (const post of this.blog.posts()) {
      for (const tag of post.tags ?? []) {
        const slug = slugify(tag);
        if (slug && wanted.has(slug)) {
          matched.add(post);
          break;
        }
      }
    }
    return Array.from(matched);
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
      if (!p) return;
      untracked(() => this.updateMetaTags(p));
    });
  }

  protected relativeTime(iso: string | null | undefined): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const diff = Math.max(0, Date.now() - then);
    const days = Math.floor(diff / 86_400_000);
    if (days < 1) return 'today';
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return String(new Date(iso).getUTCFullYear());
  }

  protected compactNumber(value: number | null | undefined): string {
    if (value == null) return '';
    if (value < 1000) return String(value);
    if (value < 10_000) return `${(value / 1000).toFixed(1)}k`;
    return `${Math.round(value / 1000)}k`;
  }

  private updateMetaTags(project: Project): void {
    const slug = project.slug ?? slugify(project.title);
    const url = `${environment.siteUrl}/projects/${slug}`;
    const title = `${project.title} — ${environment.siteName}`;
    const description = project.github?.readmeExcerpt ?? project.description;
    const image = `${environment.siteUrl}/${project.image.replace(/^\/+/, '')}`;

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:image', content: image || DEFAULT_OG_IMAGE });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: image || DEFAULT_OG_IMAGE });
    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
