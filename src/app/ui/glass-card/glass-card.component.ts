import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'ui-glass-card',
  template: '<ng-content />',
  styleUrl: './glass-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hoverable]': 'hover()',
    '[class.glow]': 'glow()',
    '[class.elevation-1]': 'elevation() === 1',
    '[class.elevation-2]': 'elevation() === 2',
    '[class.elevation-3]': 'elevation() === 3',
  },
})
export class GlassCardComponent {
  readonly elevation = input<1 | 2 | 3>(1);
  readonly hover = input(false);
  readonly glow = input(false);
}
