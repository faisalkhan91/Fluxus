import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'ui-section-header',
  template: `
    <div class="header-content">
      <h2 class="title" [id]="headingId()">{{ title() }}</h2>
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
}
