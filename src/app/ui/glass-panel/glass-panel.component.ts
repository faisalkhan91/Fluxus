import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'ui-glass-panel',
  template: '<ng-content />',
  styleUrl: './glass-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.scrollable]': 'scrollable()',
    '[class.flush]': 'flush()',
  },
})
export class GlassPanelComponent {
  scrollable = input(false);
  flush = input(false);
}
