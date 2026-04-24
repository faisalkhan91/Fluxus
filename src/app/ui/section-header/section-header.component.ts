import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type HeadingLevel = 1 | 2;

@Component({
  selector: 'ui-section-header',
  template: `
    <div class="header-content">
      @if (level() === 1) {
        <h1 class="title" [attr.id]="headingId() ?? null">{{ title() }}</h1>
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
    <div class="accent-line"></div>
  `,
  styleUrl: './section-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  title = input.required<string>();
  headingId = input<string>();
  subtitle = input<string>();
  decoration = input<string>();
  level = input<HeadingLevel>(2);
}
