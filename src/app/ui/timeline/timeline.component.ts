import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { GlassCardComponent } from '../glass-card/glass-card.component';

export interface TimelineEntry {
  type: 'period' | 'item';
  title?: string;
  subtitle?: string;
  duration?: string;
  details?: string[];
}

@Component({
  selector: 'ui-timeline',
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css',
  imports: [GlassCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {
  items = input<TimelineEntry[]>([]);
}
