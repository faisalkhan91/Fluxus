import { describe, it, expect, beforeEach, vi } from 'vitest';
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
});
