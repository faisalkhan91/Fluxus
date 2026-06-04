import { Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-glow-button',
  template: `
    <button
      [type]="type()"
      [class]="'btn btn--' + variant()"
      [disabled]="disabled()"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      (click)="clicked.emit($event)"
    >
      <ng-content />
    </button>
  `,
  styleUrl: './glow-button.component.css',
})
export class GlowButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  clicked = output<MouseEvent>();
}
