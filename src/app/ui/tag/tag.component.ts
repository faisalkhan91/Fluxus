import { Component, booleanAttribute, input } from '@angular/core';

export type TagVariant = 'accent' | 'neutral';
export type TagSize = 'sm' | 'md';

/**
 * Tag/keyword pill shared across the blog and projects surfaces. Applied as
 * an attribute to an existing `<a>` or `<span>` (`<a uiTag …>`), so the host
 * element stays a plain anchor/span — routerLink, aria-label and the
 * overflow `:nth-child` rules in the parent stylesheets keep working
 * unchanged; only the pill chrome moves here.
 *
 * Two colour families:
 *  - `accent`  — blog tags (accent-subtle fill, accent text; hover fills accent)
 *  - `neutral` — project tags (overlay fill, muted text, glass border; hover
 *                swaps text/border to accent)
 *
 * `size` toggles the compact inline pill (`sm`, blog index) vs the 24 px
 * tap-target pill (`md`, default — clears WCAG 2.2 SC 2.5.8). `interactive`
 * opts a link into the hover/focus affordance; static `<span>` pills omit it.
 */
@Component({
  selector: 'a[uiTag], span[uiTag]',
  template: '<ng-content />',
  styleUrl: './tag.component.css',
  host: {
    class: 'ui-tag',
    '[class.ui-tag--accent]': "variant() === 'accent'",
    '[class.ui-tag--neutral]': "variant() === 'neutral'",
    '[class.ui-tag--sm]': "size() === 'sm'",
    '[class.ui-tag--md]': "size() === 'md'",
    '[class.ui-tag--interactive]': 'interactive()',
  },
})
export class TagComponent {
  readonly variant = input<TagVariant>('accent');
  readonly size = input<TagSize>('md');
  readonly interactive = input(false, { transform: booleanAttribute });
}
