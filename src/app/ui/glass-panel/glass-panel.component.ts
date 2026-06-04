import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-glass-panel',
  template: '<ng-content />',
  styleUrl: './glass-panel.component.css',
  host: {
    '[class.scrollable]': 'scrollable()',
    '[class.flush]': 'flush()',
  },
})
export class GlassPanelComponent {
  readonly scrollable = input(false);
  readonly flush = input(false);
}
