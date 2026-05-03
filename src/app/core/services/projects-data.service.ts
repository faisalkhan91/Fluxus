import { Injectable, computed, signal } from '@angular/core';
import { Project } from '@shared/models/project.model';
import { slugify } from '@shared/utils/string.utils';
import { PROJECTS_GITHUB_DATA } from '@core/data/projects.github.generated';

/**
 * Hand-curated project list — the canonical source of truth. GitHub
 * metadata (stars, forks, language, last push, topics, archived, open
 * issues) is layered on top at runtime from
 * `src/app/core/data/projects.github.generated.ts`, which is populated
 * at build time by `scripts/enrich-projects-github.mjs`.
 *
 * Tag merging: repo `topics` are unioned with the hand-curated `tags`
 * via `slugify()` so the hand spelling (e.g. "CI/CD" vs. "cicd") wins
 * on collision. That way the Skills page link resolution and the
 * `/projects/tag/:tag` archive stay consistent regardless of what
 * topic names the repo owner chose.
 */
type RawProject = Omit<Project, 'slug' | 'github'>;

const RAW_PROJECTS: RawProject[] = [
  {
    title: 'Bookstore',
    description:
      'An Angular web application for browsing and purchasing books online. Built with Angular CLI, TypeScript, and component-driven architecture with routing, services, and responsive HTML/CSS templates.',
    image: 'assets/images/portfolio/BookStore.png',
    link: 'https://github.com/faisalkhan91/Bookstore',
    tags: ['Angular', 'TypeScript', 'HTML', 'CSS'],
    featured: true,
  },
  {
    title: 'Storm Events Analysis',
    description:
      'A data analysis project examining NOAA severe weather events from 2012 to 2016. Uses Hadoop MapReduce for large-scale dataset processing and Python for statistical modeling and visualization of storm patterns.',
    image: 'assets/images/portfolio/StormEvents.gif',
    link: 'https://github.com/faisalkhan91/Storm-Events',
    tags: ['Python', 'Hadoop', 'Data Science'],
    featured: true,
  },
  {
    title: 'Jenkins CI/CD Pipeline',
    description:
      'An end-to-end CI/CD pipeline built with Jenkins and Ansible. Automates building, testing, and deploying applications using Docker, Nginx, PHP, and MySQL. Includes a Maven-based Java build pipeline with unit testing and artifact management.',
    image: 'assets/images/portfolio/JenkinsCICD.PNG',
    link: 'https://github.com/faisalkhan91/Jenkins-CI-CD',
    tags: ['Jenkins', 'Ansible', 'Docker', 'CI/CD', 'Shell'],
    featured: true,
  },
  {
    title: 'Backtracking Search',
    description:
      'A Python program that solves a 6x6 Sudoku grid using the backtracking search algorithm, systematically exploring possible values and backtracking on constraint violations to produce a solved matrix.',
    image: 'assets/images/portfolio/BacktrackingSearch.PNG',
    link: 'https://github.com/faisalkhan91/Backtracking-Search',
    tags: ['Python', 'Algorithms', 'AI'],
  },
  {
    title: 'Dictionary Application',
    description:
      'A GUI-based dictionary app built with Python and Tkinter, powered by the Oxford Dictionary API. Features word definitions, etymology, phonetic pronunciation, audio playback, synonyms, antonyms, rhymes, and example usage.',
    image: 'assets/images/portfolio/DictionaryApp.PNG',
    link: 'https://github.com/faisalkhan91/Dictionary-Application',
    tags: ['Python', 'Tkinter', 'API'],
  },
  {
    title: 'Insecure File Extraction',
    description:
      'A security demonstration of path traversal exploitation in a poorly coded file upload function, showing how malicious code can be injected onto a web server through insecure file extraction.',
    image: 'assets/images/portfolio/InsecureFileExtraction.PNG',
    link: 'https://github.com/faisalkhan91/Insecure-File-Extraction',
    tags: ['Python', 'Security', 'Web'],
  },
];

function mergeTagsWithTopics(tags: string[], topics: string[]): string[] {
  // Keep hand-curated tags in their original order and spelling; append
  // any topic that doesn't collide with an existing tag's slug. Topic
  // spellings come from the repo, so they stay as-is when appended
  // (e.g. `serverless-framework`) rather than being titlecased.
  const seen = new Set(tags.map((t) => slugify(t)).filter((s): s is string => !!s));
  const extra: string[] = [];
  for (const topic of topics) {
    const slug = slugify(topic);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    extra.push(topic);
  }
  return extra.length === 0 ? tags : [...tags, ...extra];
}

@Injectable({ providedIn: 'root' })
export class ProjectsDataService {
  /**
   * Source array as a signal so callers (palette, skill-usage,
   * projects-tag) all invalidate together. The merge happens in a
   * `computed` below, so future enrichment arriving at runtime (e.g.
   * a service-worker refresh) would propagate automatically.
   */
  private readonly rawProjects = signal<RawProject[]>(RAW_PROJECTS);

  readonly projects = computed<Project[]>(() =>
    this.rawProjects().map((raw): Project => {
      const slug = slugify(raw.title);
      const gh = PROJECTS_GITHUB_DATA[slug];
      const mergedTags = gh ? mergeTagsWithTopics(raw.tags, gh.topics) : raw.tags;
      return gh ? { ...raw, slug, tags: mergedTags, github: gh } : { ...raw, slug, tags: mergedTags };
    }),
  );
}
