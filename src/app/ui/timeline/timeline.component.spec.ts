import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineComponent, TimelineEntry } from './timeline.component';

describe('TimelineComponent', () => {
  let fixture: ComponentFixture<TimelineComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TimelineComponent] }).compileComponents();
    fixture = TestBed.createComponent(TimelineComponent);
    el = fixture.nativeElement;
  });

  it('renders nothing when the items list is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(el.querySelector('.timeline-period')).toBeNull();
    expect(el.querySelector('.timeline-entry')).toBeNull();
  });

  it('renders a period marker with its title', () => {
    const items: TimelineEntry[] = [{ type: 'period', title: 'SoFi' }];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    const period = el.querySelector('.timeline-period');
    expect(period).not.toBeNull();
    expect(period?.querySelector('.period-label')?.textContent?.trim()).toBe('SoFi');
  });

  it('renders job entries with duration, title, and detail paragraphs', () => {
    const items: TimelineEntry[] = [
      {
        type: 'item',
        subtitle: 'Senior Engineer',
        duration: '2024 — Present',
        details: ['First achievement.', 'Second achievement.'],
      },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    const entry = el.querySelector('.timeline-entry');
    expect(entry).not.toBeNull();
    expect(entry?.querySelector('.entry-duration')?.textContent?.trim()).toBe('2024 — Present');
    expect(entry?.querySelector('.entry-title')?.textContent?.trim()).toBe('Senior Engineer');
    const paragraphs = entry?.querySelectorAll('.entry-paragraph');
    expect(paragraphs?.length).toBe(2);
    expect(paragraphs?.[0].textContent?.trim()).toBe('First achievement.');
  });

  it('omits the duration span when duration is missing', () => {
    const items: TimelineEntry[] = [{ type: 'item', subtitle: 'Contributor' }];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    const entry = el.querySelector('.timeline-entry');
    expect(entry).not.toBeNull();
    expect(entry?.querySelector('.entry-duration')).toBeNull();
  });

  it('renders periods and items together in document order', () => {
    const items: TimelineEntry[] = [
      { type: 'period', title: 'Company A' },
      { type: 'item', subtitle: 'Role 1', details: ['One.'] },
      { type: 'period', title: 'Company B' },
      { type: 'item', subtitle: 'Role 2', details: ['Two.'] },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    const rows = el.querySelectorAll('.timeline > *');
    expect(rows.length).toBe(4);
    expect(rows[0].classList.contains('timeline-period')).toBe(true);
    expect(rows[1].classList.contains('timeline-entry')).toBe(true);
    expect(rows[2].classList.contains('timeline-period')).toBe(true);
    expect(rows[3].classList.contains('timeline-entry')).toBe(true);
  });
});
