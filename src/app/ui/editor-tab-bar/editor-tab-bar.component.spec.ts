import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { EditorTabBarComponent, EditorTab } from './editor-tab-bar.component';

const MOCK_TABS: EditorTab[] = [
  { id: 'hero', label: 'Welcome', ext: '.tsx', color: '#61dafb', route: '/' },
  { id: 'about', label: 'About', ext: '.md', color: '#42a5f5', route: '/about' },
  { id: 'blog', label: 'Blog', ext: '.rss', color: '#ff9800', route: '/blog' },
];

describe('EditorTabBarComponent', () => {
  let fixture: ComponentFixture<EditorTabBarComponent>;
  let component: EditorTabBarComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorTabBarComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorTabBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tabs', MOCK_TABS);
    fixture.componentRef.setInput('activeTabId', 'hero');
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render correct number of tabs', () => {
    const tabs = el.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);
  });

  it('renders tabs as native button elements', () => {
    const tabs = el.querySelectorAll('[role="tab"]');
    tabs.forEach((tab) => expect(tab.tagName).toBe('BUTTON'));
  });

  it('should mark active tab with aria-selected true', () => {
    const active = el.querySelector('[aria-selected="true"]');
    expect(active?.textContent).toContain('Welcome');
  });

  it('should give active tab tabindex 0', () => {
    const active = el.querySelector('.tab.active') as HTMLElement;
    expect(active?.getAttribute('tabindex')).toBe('0');
  });

  it('should give inactive tabs tabindex -1', () => {
    const inactive = el.querySelectorAll('.tab:not(.active)');
    inactive.forEach((tab) => {
      expect(tab.getAttribute('tabindex')).toBe('-1');
    });
  });

  it('should emit tabSelected on click', () => {
    let selected: EditorTab | undefined;
    component.tabSelected.subscribe((t: EditorTab) => (selected = t));
    const aboutTab = el.querySelectorAll('[role="tab"]')[1] as HTMLElement;
    aboutTab.click();
    expect(selected?.id).toBe('about');
  });

  it('should not show close button for hero tab', () => {
    const heroTab = el.querySelector('.tab.active');
    expect(heroTab?.querySelector('.tab-close')).toBeNull();
  });

  it('should show close button for non-hero tabs', () => {
    const nonHeroTabs = el.querySelectorAll('.tab:not(.active)');
    nonHeroTabs.forEach((tab) => {
      expect(tab.querySelector('.tab-close')).toBeTruthy();
    });
  });

  it('should emit tabClosed when close button is clicked', () => {
    let closed: EditorTab | undefined;
    component.tabClosed.subscribe((t: EditorTab) => (closed = t));
    const closeBtn = el.querySelector('.tab:nth-child(2) .tab-close') as HTMLElement;
    closeBtn.click();
    expect(closed?.id).toBe('about');
  });

  it('emits tabSelected and moves focus on ArrowRight (with wrap)', () => {
    const tabs = Array.from(el.querySelectorAll('[role="tab"]')) as HTMLElement[];
    let selected: EditorTab | undefined;
    component.tabSelected.subscribe((t: EditorTab) => (selected = t));

    document.body.appendChild(el);

    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(selected?.id).toBe('about');
    expect(document.activeElement).toBe(tabs[1]);

    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(selected?.id).toBe('hero');
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('emits tabSelected and moves focus on ArrowLeft (with wrap)', () => {
    const tabs = Array.from(el.querySelectorAll('[role="tab"]')) as HTMLElement[];
    let selected: EditorTab | undefined;
    component.tabSelected.subscribe((t: EditorTab) => (selected = t));

    document.body.appendChild(el);

    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(selected?.id).toBe('blog');
    expect(document.activeElement).toBe(tabs[2]);
  });

  it('should emit tabClosed on Delete key for non-hero tab', () => {
    let closed: EditorTab | undefined;
    component.tabClosed.subscribe((t: EditorTab) => (closed = t));
    const aboutTab = el.querySelectorAll('[role="tab"]')[1] as HTMLElement;
    aboutTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(closed?.id).toBe('about');
  });

  it('should not emit tabClosed on Delete key for hero tab', () => {
    let closed: EditorTab | undefined;
    component.tabClosed.subscribe((t: EditorTab) => (closed = t));
    const heroTab = el.querySelectorAll('[role="tab"]')[0] as HTMLElement;
    heroTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(closed).toBeUndefined();
  });

  it('shows a "Close all" button when there are closable tabs', () => {
    const closeAll = el.querySelector('.close-all');
    expect(closeAll).toBeTruthy();
    expect(closeAll?.getAttribute('aria-label')).toContain('Close all');
  });

  it('hides the "Close all" button when only the hero tab is open', () => {
    fixture.componentRef.setInput('tabs', [MOCK_TABS[0]]);
    fixture.detectChanges();
    expect(el.querySelector('.close-all')).toBeNull();
  });

  it('emits closeAllRequested when the "Close all" button is clicked', () => {
    let fired = false;
    component.closeAllRequested.subscribe(() => (fired = true));
    (el.querySelector('.close-all') as HTMLElement).click();
    expect(fired).toBe(true);
  });

  it('renders left and right scroll fade indicators (initially hidden)', () => {
    const left = el.querySelector('.scroll-fade--left');
    const right = el.querySelector('.scroll-fade--right');
    expect(left).toBeTruthy();
    expect(right).toBeTruthy();
    expect(left?.classList.contains('visible')).toBe(false);
    expect(right?.classList.contains('visible')).toBe(false);
  });
});
