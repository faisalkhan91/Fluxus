import { Component, input } from '@angular/core';
import { IconComponent } from '@ui/icon/icon.component';

/**
 * The "Source" link to a project's GitHub repo — a github icon, the word
 * Source, and an external-link glyph — repeated on every project card
 * (list hero, list row, grid, and the tag archive). Applied as an attribute
 * to an existing `<a>` so the host stays a plain anchor: callers supply
 * `[href]` and `[attr.aria-label]`, while `target="_blank"`, `rel`, the
 * `.project-link` chrome, and the icon trio live here.
 *
 * `.project-link` stays the host class (not `:host`-renamed) because the
 * card footers position it via `.project-footer .project-link` /
 * `.projects-list-hero-footer .project-link` overrides.
 */
@Component({
  selector: 'a[uiSourceLink]',
  imports: [IconComponent],
  template: `
    <ui-icon name="github" [size]="iconSize()" />
    <span>Source</span>
    <ui-icon name="external-link" [size]="12" />
  `,
  styleUrl: './source-link.component.css',
  host: {
    class: 'project-link',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
})
export class SourceLinkComponent {
  /** github-icon size; cards use 14 (list) or 16 (grid/tag archive). */
  readonly iconSize = input(14);
}
