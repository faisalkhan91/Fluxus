import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CopyCodeService } from './copy-code.service';

describe('CopyCodeService', () => {
  let service: CopyCodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CopyCodeService);
  });

  it('returns a callable disposer from attach()', () => {
    const root = document.createElement('div');
    const dispose = service.attach(root);
    expect(typeof dispose).toBe('function');
    dispose();
  });

  it('ignores clicks that miss a .copy-btn', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>not a button</p>';
    const dispose = service.attach(root);
    // Must not throw when the click target has no .copy-btn ancestor.
    expect(() =>
      root.querySelector('p')!.dispatchEvent(new MouseEvent('click', { bubbles: true })),
    ).not.toThrow();
    dispose();
  });
});
