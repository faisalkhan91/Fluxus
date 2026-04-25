import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ErrorToastService } from '@core/services/error-toast.service';

@Component({
  selector: 'ui-toast-region',
  templateUrl: './toast-region.component.html',
  styleUrl: './toast-region.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    'aria-label': 'Notifications',
  },
})
export class ToastRegionComponent {
  protected toasts = inject(ErrorToastService);
}
