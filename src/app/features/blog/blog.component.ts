import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GlassCardComponent } from '../../ui/glass-card/glass-card.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { SectionHeaderComponent } from '../../ui/section-header/section-header.component';
import { BlogService } from '../../core/services/blog.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
  imports: [GlassCardComponent, IconComponent, SectionHeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent implements OnInit {
  protected blog = inject(BlogService);

  ngOnInit(): void {
    this.blog.loadPosts();
  }
}
