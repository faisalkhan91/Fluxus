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
      style({ opacity: 0, transform: 'translateY(12px)' }),
    ], { optional: true }),
    group([
      query(':leave', [
        animate('180ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateY(-8px)' })
        ),
      ], { optional: true }),
      query(':enter', [
        animate('280ms 100ms cubic-bezier(0.0, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ], { optional: true }),
    ]),
  ]),
]);
