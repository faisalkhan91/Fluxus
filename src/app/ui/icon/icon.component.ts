import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { ICONS } from './icons';
import type { IconShape } from './icons';

@Component({
  selector: 'ui-icon',
  templateUrl: './icon.component.html',
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input(20);

  /**
   * Resolved shape list for the requested icon, or an empty list when the
   * name is unknown. Pre-resolving via a computed keeps the template cheap
   * and gives the SSR pass everything it needs to render the path data.
   */
  protected readonly shapes = computed<IconShape[]>(() => ICONS[this.name()] ?? []);
}
