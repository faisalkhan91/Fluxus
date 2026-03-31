import {
  trigger,
  transition,
  style,
  animate,
  query,
  group,
} from '@angular/animations';

export const routeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'scale(0.98)' }),
    ], { optional: true }),
    group([
      query(':leave', [
        animate('120ms cubic-bezier(0.4, 0, 1, 1)',
          style({ opacity: 0 })
        ),
      ], { optional: true }),
      query(':enter', [
        animate('160ms 40ms cubic-bezier(0, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'scale(1)' })
        ),
      ], { optional: true }),
    ]),
  ]),
]);
