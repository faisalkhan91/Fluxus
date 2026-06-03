import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ReadingProgressService } from './reading-progress.service';

describe('ReadingProgressService', () => {
  let service: ReadingProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReadingProgressService);
  });

  it('starts at 0', () => {
    expect(service.progress()).toBe(0);
  });

  it('returns a callable disposer from start()', () => {
    const dispose = service.start();
    expect(typeof dispose).toBe('function');
    // Tearing down twice must be safe.
    dispose();
    dispose();
  });
});
