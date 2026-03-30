import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SectionHeaderComponent } from '../../ui/section-header/section-header.component';
import { GlassCardComponent } from '../../ui/glass-card/glass-card.component';
import { GlowButtonComponent } from '../../ui/glow-button/glow-button.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { ProfileDataService } from '../../core/services/profile-data.service';

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

  protected contactForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: [''],
    message: ['', Validators.required],
  });

  protected submitted = signal(false);

  onSubmit(): void {
    if (this.contactForm.valid) {
      const mailto = `mailto:${this.profile.personalInfo().email}?subject=${encodeURIComponent(this.contactForm.value.subject ?? '')}&body=${encodeURIComponent(
        `From: ${this.contactForm.value.name} (${this.contactForm.value.email})\n\n${this.contactForm.value.message}`
      )}`;
      if (typeof window !== 'undefined') {
        window.open(mailto, '_blank');
      }
      this.submitted.set(true);
    }
  }
}
