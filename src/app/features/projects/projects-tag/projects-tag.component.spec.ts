import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { ProjectsTagComponent } from './projects-tag.component';
import { ProjectsDataService } from '@core/services/projects-data.service';
import type { Project } from '@shared/models/project.model';
import { environment } from '@env/environment';

const MOCK_PROJECTS: Project[] = [
  {
    title: 'Atlas',
    description: 'A',
    image: 'a.png',
    link: '#a',
    tags: ['Rust', 'CI/CD'],
    featured: true,
  },
  {
    title: 'Beacon',
    description: 'B',
    image: 'b.png',
    link: '#b',
    tags: ['Rust', 'TypeScript'],
  },
  {
    title: 'Citrus',
    description: 'C',
    image: 'c.png',
    link: '#c',
    tags: ['Python'],
  },
];

describe('ProjectsTagComponent', () => {
  let fixture: ComponentFixture<ProjectsTagComponent>;
  let titleService: Title;
  let metaService: Meta;
  let document: Document;
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({ tag: 'rust' }));

    await TestBed.configureTestingModule({
      imports: [ProjectsTagComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        {
          provide: ProjectsDataService,
          useValue: { projects: signal(MOCK_PROJECTS) },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    document = TestBed.inject(DOCUMENT);
    vi.spyOn(titleService, 'setTitle');
    vi.spyOn(metaService, 'updateTag');

    fixture = TestBed.createComponent(ProjectsTagComponent);
    fixture.detectChanges();
  });

  it('renders only projects whose tags match the slug', () => {
    const titles = Array.from(
      fixture.nativeElement.querySelectorAll('.project-title') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual(['Atlas', 'Beacon']);
  });

  it('updates <title> using the resolved label and site name', () => {
    expect(titleService.setTitle).toHaveBeenCalledWith(
      `Projects tagged "Rust" - ${environment.siteName}`,
    );
  });

  it('writes og:title, twitter:title, description, and og:url for the tag page', () => {
    const updateTag = metaService.updateTag as unknown as ReturnType<typeof vi.fn>;
    const tags = updateTag.mock.calls.map((args) => args[0] as Record<string, string>);
    const expectTag = (predicate: (tag: Record<string, string>) => boolean) =>
      expect(tags.some(predicate)).toBe(true);

    expectTag((t) => t['property'] === 'og:title' && t['content'].includes('Rust'));
    expectTag((t) => t['name'] === 'twitter:title' && t['content'].includes('Rust'));
    expectTag((t) => t['name'] === 'description' && t['content'].includes('Rust'));
    expectTag(
      (t) =>
        t['property'] === 'og:url' && t['content'] === `${environment.siteUrl}/projects/tag/rust`,
    );
    expectTag((t) => t['property'] === 'og:type' && t['content'] === 'website');
  });

  it('writes/updates a single canonical link pointing at the tag URL', () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe(`${environment.siteUrl}/projects/tag/rust`);
  });

  it('renders Home > Projects > <Tag> breadcrumb with aria-current on the tag', () => {
    const items = fixture.nativeElement.querySelectorAll('.tag-breadcrumb li');
    expect(items.length).toBe(3);
    expect(items[0].textContent?.trim()).toBe('Home');
    expect(items[1].textContent?.trim()).toBe('Projects');
    expect(items[2].textContent?.trim()).toBe('Rust');
    expect(items[2].getAttribute('aria-current')).toBe('page');
  });

  it('updates meta + canonical when the route param changes', () => {
    paramMapSubject.next(convertToParamMap({ tag: 'python' }));
    fixture.detectChanges();
    expect(titleService.setTitle).toHaveBeenLastCalledWith(
      `Projects tagged "Python" - ${environment.siteName}`,
    );
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(link?.getAttribute('href')).toBe(`${environment.siteUrl}/projects/tag/python`);
    const titles = Array.from(
      fixture.nativeElement.querySelectorAll('.project-title') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual(['Citrus']);
  });

  it('renders the empty-state when no projects match the slug', () => {
    paramMapSubject.next(convertToParamMap({ tag: 'unknown' }));
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('.tag-status');
    expect(status).toBeTruthy();
    expect(status.textContent).toContain('No projects found');
    const titles = fixture.nativeElement.querySelectorAll('.project-title');
    expect(titles.length).toBe(0);
  });

  it('matches "cicd" slug against tags spelled "CI/CD" via slugify normalisation', () => {
    paramMapSubject.next(convertToParamMap({ tag: 'cicd' }));
    fixture.detectChanges();
    const titles = Array.from(
      fixture.nativeElement.querySelectorAll('.project-title') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual(['Atlas']);
  });
});
