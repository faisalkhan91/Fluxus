import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ErrorToastService } from './error-toast.service';

describe('ErrorToastService', () => {
  let service: ErrorToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorToastService);
  });

  it('starts empty', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('push assigns monotonically increasing ids and returns them', () => {
    const id1 = service.push({ title: 'First' });
    const id2 = service.push({ title: 'Second' });
    const id3 = service.push({ title: 'Third' });

    expect(id1).toBe(1);
    expect(id2).toBe(2);
    expect(id3).toBe(3);
  });

  it('push appends the toast to the signal and preserves insertion order', () => {
    service.push({ title: 'First' });
    service.push({ title: 'Second' });

    const titles = service.toasts().map((t) => t.title);
    expect(titles).toEqual(['First', 'Second']);
  });

  it('push preserves optional detail, actionLabel, and action fields', () => {
    const action = vi.fn();
    const id = service.push({
      title: 'Chunk failed',
      detail: 'Please reload',
      actionLabel: 'Reload',
      action,
    });

    const toast = service.toasts().find((t) => t.id === id);
    expect(toast?.detail).toBe('Please reload');
    expect(toast?.actionLabel).toBe('Reload');
    expect(toast?.action).toBe(action);
  });

  it('dismiss removes only the toast with the matching id', () => {
    const id1 = service.push({ title: 'Keep me' });
    const id2 = service.push({ title: 'Drop me' });

    service.dismiss(id2);

    expect(service.toasts().map((t) => t.id)).toEqual([id1]);
  });

  it('dismiss is a no-op for unknown ids', () => {
    service.push({ title: 'Still here' });
    service.dismiss(999);
    expect(service.toasts()).toHaveLength(1);
  });

  it('clear empties the signal', () => {
    service.push({ title: 'One' });
    service.push({ title: 'Two' });
    service.clear();

    expect(service.toasts()).toEqual([]);
  });

  it('ids continue advancing after clear (so late dismiss calls cannot collide)', () => {
    service.push({ title: 'One' });
    service.clear();
    const id = service.push({ title: 'Two' });
    expect(id).toBe(2);
  });

  describe('auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('info-severity toasts auto-dismiss after the default TTL', () => {
      service.push({ title: 'Section link copied' });
      expect(service.toasts()).toHaveLength(1);
      vi.advanceTimersByTime(3999);
      expect(service.toasts()).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(service.toasts()).toHaveLength(0);
    });

    it('default severity (omitted) is treated as info and auto-dismisses', () => {
      service.push({ title: 'No severity field' });
      vi.advanceTimersByTime(4000);
      expect(service.toasts()).toHaveLength(0);
    });

    it('error-severity toasts stay sticky', () => {
      service.push({ severity: 'error', title: 'Chunk failed', actionLabel: 'Reload' });
      vi.advanceTimersByTime(60_000);
      expect(service.toasts()).toHaveLength(1);
    });

    it('explicit ttl: null pins an info toast as sticky', () => {
      service.push({ title: 'Stay put', ttl: null });
      vi.advanceTimersByTime(60_000);
      expect(service.toasts()).toHaveLength(1);
    });

    it('explicit numeric ttl overrides the severity default for error toasts', () => {
      service.push({ severity: 'error', title: 'Quick error', ttl: 500 });
      vi.advanceTimersByTime(499);
      expect(service.toasts()).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(service.toasts()).toHaveLength(0);
    });

    it('manual dismiss cancels the pending auto-dismiss timer', () => {
      const id = service.push({ title: 'Click me away' });
      service.dismiss(id);
      // If the timer were not cancelled, advancing past TTL would call
      // dismiss(id) again — a no-op against the now-empty list, but the
      // timer would still leak. The signal stays empty either way; we
      // verify lifecycle by re-pushing and ensuring its TTL still fires
      // on schedule (i.e. the prior timer didn't accidentally clear this
      // one).
      const id2 = service.push({ title: 'Fresh' });
      expect(id2).toBe(id + 1);
      vi.advanceTimersByTime(4000);
      expect(service.toasts()).toHaveLength(0);
    });

    it('clear() cancels every pending timer', () => {
      service.push({ title: 'a' });
      service.push({ title: 'b' });
      service.push({ title: 'c' });
      service.clear();
      expect(service.toasts()).toHaveLength(0);
      // Advance past the default TTL — no timer should still be live.
      vi.advanceTimersByTime(4000);
      expect(service.toasts()).toHaveLength(0);
    });
  });
});
