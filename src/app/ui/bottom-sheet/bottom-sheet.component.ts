import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
  effect,
  ElementRef,
  OnDestroy,
} from '@angular/core';
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
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class BottomSheetComponent implements OnDestroy {
  private doc = inject(DOCUMENT);
  private elRef = inject(ElementRef);

  open = input(false);
  title = input<string>('');
  closed = output<void>();

  protected dragOffset = signal(0);

  private previouslyFocused: HTMLElement | null = null;
  private focusTrapListener: ((e: FocusEvent) => void) | null = null;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.previouslyFocused = this.doc.activeElement as HTMLElement;
        queueMicrotask(() => {
          const sheet = this.elRef.nativeElement.querySelector('.sheet');
          sheet?.focus();
          this.enableFocusTrap();
        });
      } else {
        this.disableFocusTrap();
        this.previouslyFocused?.focus();
        this.previouslyFocused = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.disableFocusTrap();
  }

  onEscapeKey(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }

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

  private enableFocusTrap(): void {
    this.focusTrapListener = (e: FocusEvent) => {
      const sheet = this.elRef.nativeElement.querySelector('.sheet');
      if (sheet && !sheet.contains(e.target as Node)) {
        e.preventDefault();
        sheet.focus();
      }
    };
    this.doc.addEventListener('focusin', this.focusTrapListener);
  }

  private disableFocusTrap(): void {
    if (this.focusTrapListener) {
      this.doc.removeEventListener('focusin', this.focusTrapListener);
      this.focusTrapListener = null;
    }
  }
}
