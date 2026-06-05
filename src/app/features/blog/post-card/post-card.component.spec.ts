import { describe, it, expect, beforeEach } from 'vitest';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { BlogPost } from '@shared/models/blog-post.model';
import { createMockBlogPost } from '@testing/blog-mocks';
import { PostCardComponent } from './post-card.component';

describe('PostCardComponent', () => {
  let fixture: ComponentFixture<PostCardComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(PostCardComponent);
    el = fixture.nativeElement;
  });

  function render(post: BlogPost, inputs: Record<string, unknown> = {}): void {
    fixture.componentRef.setInput('post', post);
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
  }

  it('non-featured with a cover renders the 1:1 thumbnail (no hero cover, no sigil)', () => {
    render(createMockBlogPost({ slug: 's', cover: '/og/s.png' }));
    expect(el.querySelector('.post-card-thumb img')).not.toBeNull();
    expect(el.querySelector('.post-card-cover')).toBeNull();
    expect(el.querySelector('.post-card-sigil')).toBeNull();
  });

  it('renders the // <slug>.md sigil when a non-featured post has no cover', () => {
    render(createMockBlogPost({ slug: 'my-post' }));
    expect(el.querySelector('.post-card-thumb')).toBeNull();
    expect(el.querySelector('.post-card-sigil')?.textContent?.trim()).toBe('// my-post.md');
  });

  it('featured renders the hero cover and flags the link', () => {
    render(createMockBlogPost({ slug: 's' }), { featured: true, cover: '/og/s.png' });
    expect(el.querySelector('.post-card-cover img')).not.toBeNull();
    expect(el.querySelector('.post-card-thumb')).toBeNull();
    expect(el.querySelector('.post-link')?.classList.contains('post-link--featured')).toBe(true);
  });

  it('toggles the .clamp host class via clampText', () => {
    render(createMockBlogPost(), { clampText: true });
    expect(el.classList.contains('clamp')).toBe(true);
  });

  it('renders title, excerpt, and one ui-tag pill per tag', () => {
    render(createMockBlogPost({ title: 'Hello', excerpt: 'Ex', tags: ['angular', 'go'] }));
    expect(el.querySelector('.post-title')?.textContent?.trim()).toBe('Hello');
    expect(el.querySelector('.post-excerpt')?.textContent?.trim()).toBe('Ex');
    expect(el.querySelectorAll('.post-tags .ui-tag').length).toBe(2);
  });

  it('links to the post and staggers the entrance by index * enterDelayStep', () => {
    render(createMockBlogPost({ slug: 'deep-dive' }), { index: 2, enterDelayStep: 30 });
    expect(el.querySelector('.post-link')?.getAttribute('href')).toBe('/blog/deep-dive');
    expect(el.style.getPropertyValue('--enter-delay')).toBe('60ms');
  });
});
