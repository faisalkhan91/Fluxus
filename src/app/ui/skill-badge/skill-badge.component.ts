import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'ui-skill-badge',
  template: `
    <div class="badge-inner">
      @if (iconSrc()) {
        <img [ngSrc]="iconSrc()!" [alt]="name()" width="40" height="40" class="badge-icon" />
      }
      <span class="badge-name">{{ name() }}</span>
      @if (level()) {
        <div
          class="badge-bar"
          role="progressbar"
          [attr.aria-valuenow]="level()"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="badge-fill" [style.--badge-fill-scale]="level()! / 100"></div>
        </div>
      }
    </div>
  `,
  styleUrl: './skill-badge.component.css',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillBadgeComponent {
  name = input.required<string>();
  iconSrc = input<string>();
  level = input<number>();
}
