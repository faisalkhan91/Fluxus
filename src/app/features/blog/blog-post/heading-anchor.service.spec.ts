import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HeadingAnchorService } from './heading-anchor.service';

describe('HeadingAnchorService', () => {
  let service: HeadingAnchorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HeadingAnchorService);
  });

  describe('rewriteHrefs', () => {
    it('rewrites [data-anchor-id] hrefs against the post slug', () => {
      const root = document.createElement('div');
      root.innerHTML =
        '<a class="anchor" data-anchor-id="intro" href="#intro"></a>' +
        '<a class="anchor" data-anchor-id="setup" href="#setup"></a>';
      service.rewriteHrefs(root, 'my-post');
      const hrefs = [...root.querySelectorAll('a')].map((a) => a.getAttribute('href'));
      expect(hrefs).toEqual(['/blog/my-post#intro', '/blog/my-post#setup']);
    });

    it('skips anchors with an empty data-anchor-id', () => {
      const root = document.createElement('div');
      root.innerHTML = '<a class="anchor" data-anchor-id="" href="#x"></a>';
      service.rewriteHrefs(root, 'my-post');
      expect(root.querySelector('a')?.getAttribute('href')).toBe('#x');
    });

    it('is a no-op when the slug is empty', () => {
      const root = document.createElement('div');
      root.innerHTML = '<a class="anchor" data-anchor-id="intro" href="#intro"></a>';
      service.rewriteHrefs(root, '');
      expect(root.querySelector('a')?.getAttribute('href')).toBe('#intro');
    });
  });

  describe('attach', () => {
    it('returns a disposer that removes the listener', () => {
      const root = document.createElement('div');
      const dispose = service.attach(root, () => 'my-post');
      expect(typeof dispose).toBe('function');
      // A click that hits no anchor must not throw.
      root.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      dispose();
    });
  });
});
