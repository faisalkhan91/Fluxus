import { describe, it, expect, beforeEach } from 'vitest';
import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { TagComponent, type TagSize, type TagVariant } from './tag.component';

/**
 * `uiTag` is an attribute-component (`a[uiTag], span[uiTag]`), so it's
 * exercised through a host that applies the attribute to real anchor/span
 * elements — that also covers the "works on both host tags" contract. The
 * host inputs are signals so `.set()` marks the (zoneless, OnPush) host dirty.
 */
@Component({
  imports: [TagComponent],
  template: `
    <a uiTag [variant]="variant()" [size]="size()" [interactive]="interactive()">link tag</a>
    <span uiTag>span tag</span>
  `,
})
class HostComponent {
  readonly variant = signal<TagVariant>('accent');
  readonly size = signal<TagSize>('md');
  readonly interactive = signal(false);
}

describe('TagComponent (uiTag)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HTMLElement;
  let anchor: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
    anchor = host.querySelector('a')!;
  });

  it('applies the base ui-tag class to both a[uiTag] and span[uiTag] hosts', () => {
    expect(anchor.classList.contains('ui-tag')).toBe(true);
    expect(host.querySelector('span')!.classList.contains('ui-tag')).toBe(true);
  });

  it('projects its content', () => {
    expect(anchor.textContent?.trim()).toBe('link tag');
  });

  it('defaults to accent + md + non-interactive', () => {
    expect(anchor.classList.contains('ui-tag--accent')).toBe(true);
    expect(anchor.classList.contains('ui-tag--md')).toBe(true);
    expect(anchor.classList.contains('ui-tag--interactive')).toBe(false);
  });

  it('reflects variant=neutral', () => {
    fixture.componentInstance.variant.set('neutral');
    fixture.detectChanges();
    expect(anchor.classList.contains('ui-tag--neutral')).toBe(true);
    expect(anchor.classList.contains('ui-tag--accent')).toBe(false);
  });

  it('reflects size=sm', () => {
    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();
    expect(anchor.classList.contains('ui-tag--sm')).toBe(true);
    expect(anchor.classList.contains('ui-tag--md')).toBe(false);
  });

  it('toggles ui-tag--interactive (the hover/focus affordance opt-in)', () => {
    fixture.componentInstance.interactive.set(true);
    fixture.detectChanges();
    expect(anchor.classList.contains('ui-tag--interactive')).toBe(true);
  });
});
