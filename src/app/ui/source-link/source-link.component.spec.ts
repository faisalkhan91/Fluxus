import { describe, it, expect, beforeEach } from 'vitest';
import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { SourceLinkComponent } from './source-link.component';

/**
 * `uiSourceLink` is an attribute-component (`a[uiSourceLink]`) — tested via a
 * host anchor that supplies [href]/[attr.aria-label]/[iconSize]; the component
 * itself contributes target/rel, the `.project-link` chrome, and the icon trio.
 * `iconSize` is a signal so `.set()` marks the (zoneless, OnPush) host dirty.
 */
@Component({
  imports: [SourceLinkComponent],
  template: `<a uiSourceLink [href]="href()" [iconSize]="iconSize()" [attr.aria-label]="label()">x</a>`,
})
class HostComponent {
  href = signal('https://github.com/acme/widget');
  iconSize = signal(14);
  label = signal('View widget on GitHub');
}

describe('SourceLinkComponent (uiSourceLink)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let anchor: HTMLAnchorElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    anchor = fixture.nativeElement.querySelector('a')!;
  });

  it('is a .project-link anchor that opens safely in a new tab', () => {
    expect(anchor.classList.contains('project-link')).toBe(true);
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    expect(anchor.getAttribute('href')).toBe('https://github.com/acme/widget');
    expect(anchor.getAttribute('aria-label')).toBe('View widget on GitHub');
  });

  it('renders the github icon, the "Source" label, and an external-link icon', () => {
    expect(anchor.querySelectorAll('ui-icon').length).toBe(2);
    expect(anchor.textContent).toContain('Source');
  });

  it('sizes the github icon via iconSize while the external-link stays 12', () => {
    const svgs = anchor.querySelectorAll('ui-icon svg');
    expect(svgs[0]?.getAttribute('width')).toBe('14');
    expect(svgs[1]?.getAttribute('width')).toBe('12');

    fixture.componentInstance.iconSize.set(16);
    fixture.detectChanges();
    expect(anchor.querySelectorAll('ui-icon svg')[0]?.getAttribute('width')).toBe('16');
  });
});
