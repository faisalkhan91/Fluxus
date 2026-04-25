import {
  Component,
  ChangeDetectionStrategy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SectionHeaderComponent } from '../../ui/section-header/section-header.component';
import { GlassCardComponent } from '../../ui/glass-card/glass-card.component';
import { GlowButtonComponent } from '../../ui/glow-button/glow-button.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { ProfileDataService } from '../../core/services/profile-data.service';

type SubmitStage = 'editing' | 'awaiting-confirmation' | 'sent';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
  imports: [
    ReactiveFormsModule,
    SectionHeaderComponent,
    GlassCardComponent,
    GlowButtonComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  protected profile = inject(ProfileDataService);
  private fb = inject(FormBuilder);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected contactForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: [''],
    message: ['', Validators.required],
  });

  readonly stage = signal<SubmitStage>('editing');
  readonly emailCopied = signal(false);
  readonly submitted = computed(() => this.stage() === 'sent');

  /**
   * Returns the matching error span id for `aria-describedby` only when that
   * span is currently rendered. Wiring `aria-describedby` to a non-existent
   * id is an Axe violation (`aria-valid-attr-value`).
   */
  protected errorIdFor(field: 'name' | 'email' | 'message'): string | null {
    const control = this.contactForm.get(field);
    return control?.invalid && control.touched ? `${field}-error` : null;
  }

  onSubmit(): void {
    if (!this.contactForm.valid) return;

    const { name, email, subject, message } = this.contactForm.getRawValue();
    const mailto = `mailto:${this.profile.personalInfo().email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;

    if (this.isBrowser) {
      window.open(mailto, '_blank');
    }
    this.stage.set('awaiting-confirmation');
  }

  confirmSent(): void {
    this.stage.set('sent');
  }

  backToForm(): void {
    this.stage.set('editing');
    this.emailCopied.set(false);
  }

  async copyEmail(): Promise<void> {
    const email = this.profile.personalInfo().email;
    if (!this.isBrowser) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const fallback = document.createElement('textarea');
        fallback.value = email;
        fallback.setAttribute('readonly', '');
        fallback.style.position = 'absolute';
        fallback.style.left = '-9999px';
        document.body.appendChild(fallback);
        fallback.select();
        document.execCommand('copy');
        document.body.removeChild(fallback);
      }
      this.emailCopied.set(true);
      setTimeout(() => this.emailCopied.set(false), 2000);
    } catch {
      this.emailCopied.set(false);
    }
  }
}
