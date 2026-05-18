import { Injectable, signal } from '@angular/core';
import type { Project } from '@shared/models/project.model';
import { PROJECTS } from '@core/data/projects.generated';

/**
 * Projects source-of-truth. The list is produced at build time by
 * `scripts/fetch-projects-github.mjs`, which merges GitHub repo data
 * (selected via `src/app/core/data/projects.overrides.json`) with the
 * hand-edited override fields and any non-GitHub "manual" entries.
 *
 * This service is intentionally thin: it lifts the generated list
 * into a `signal<Project[]>` so that downstream consumers (palette,
 * skill-usage index, projects-tag archive, detail page, hero featured
 * strip) keep the same reactivity contract they had under the prior
 * hand-curated architecture. Nothing here knows or cares whether a
 * row is from GitHub or a manual entry — everything flows through
 * the same `Project` shape.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsDataService {
  readonly projects = signal<Project[]>([...PROJECTS]);
}
