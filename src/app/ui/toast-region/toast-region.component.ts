import { Component, inject } from '@angular/core';
import { ErrorToastService } from '@core/services/error-toast.service';

@Component({
  selector: 'ui-toast-region',
  templateUrl: './toast-region.component.html',
  styleUrl: './toast-region.component.css',
  host: {
    role: 'region',
    'aria-label': 'Notifications',
    // The region is a *persistent* polite live region: it exists in the DOM
    // before any toast is inserted, so screen readers reliably announce
    // dynamically-added children. (A live role placed on the toast node itself
    // — which is created already-populated — is dropped by many SR/browser
    // combos.) Error toasts opt up to assertive via role="alert" on the node.
    'aria-live': 'polite',
  },
})
export class ToastRegionComponent {
  protected toasts = inject(ErrorToastService);
}
