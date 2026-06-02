import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type HeadingLevel = 1 | 2;

@Component({
  selector: 'ui-section-header',
  template: `
    <div class="header-content">
      @if (level() === 1) {
        <h1 class="title title--page" [attr.id]="headingId() ?? null">{{ title() }}</h1>
      } @else {
        <h2 class="title" [attr.id]="headingId() ?? null">{{ title() }}</h2>
      }
      @if (subtitle()) {
        <p class="subtitle">{{ subtitle() }}</p>
      }
      @if (decoration()) {
        <span class="decoration">{{ decoration() }}</span>
      }
    </div>
    <div class="accent-line" [class.accent-line--page]="level() === 1"></div>
  `,
  styleUrl: './section-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly headingId = input<string>();
  readonly subtitle = input<string>();
  readonly decoration = input<string>();
  readonly level = input<HeadingLevel>(2);
}
