import { Component, inject } from '@angular/core';
import { ErrorToastService } from '@core/services/error-toast.service';

@Component({
  selector: 'ui-toast-region',
  templateUrl: './toast-region.component.html',
  styleUrl: './toast-region.component.css',
  host: {
    role: 'region',
    'aria-label': 'Notifications',
  },
})
export class ToastRegionComponent {
  protected toasts = inject(ErrorToastService);
}
