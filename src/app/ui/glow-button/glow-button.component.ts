import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'ui-glow-button',
  template: `
    <button
      [type]="type()"
      [class]="'btn btn--' + variant()"
      [disabled]="disabled()"
      (click)="clicked.emit($event)"
    >
      <ng-content />
    </button>
  `,
  styleUrl: './glow-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlowButtonComponent {
  variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  type = input<'button' | 'submit'>('button');
  disabled = input(false);
  clicked = output<MouseEvent>();
}
