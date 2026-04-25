import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { ICONS, IconShape } from './icons';

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
  name = input.required<string>();
  size = input(20);

  /**
   * Resolved shape list for the requested icon, or an empty list when the
   * name is unknown. Pre-resolving via a computed keeps the template cheap
   * and gives the SSR pass everything it needs to render the path data.
   */
  protected shapes = computed<IconShape[]>(() => ICONS[this.name()] ?? []);
}
