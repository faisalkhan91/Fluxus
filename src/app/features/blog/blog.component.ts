import { Component, ChangeDetectionStrategy } from '@angular/core';
import { GlassCardComponent } from '../../ui/glass-card/glass-card.component';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
  imports: [GlassCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent {}
