import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'ui-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.css',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.open]': 'open()',
  },
})
export class BottomSheetComponent {
  private doc = inject(DOCUMENT);

  open = input(false);
  title = input<string>('');
  closed = output<void>();

  protected dragOffset = signal(0);

  onBackdropClick(): void {
    this.closed.emit();
  }

  onDragStart(event: TouchEvent): void {
    const startY = event.touches[0].clientY;
    const onMove = (e: TouchEvent) => {
      const delta = e.touches[0].clientY - startY;
      if (delta > 0) this.dragOffset.set(delta);
    };
    const onEnd = () => {
      if (this.dragOffset() > 100) {
        this.closed.emit();
      }
      this.dragOffset.set(0);
      this.doc.removeEventListener('touchmove', onMove);
      this.doc.removeEventListener('touchend', onEnd);
    };
    this.doc.addEventListener('touchmove', onMove, { passive: true });
    this.doc.addEventListener('touchend', onEnd);
  }
}
