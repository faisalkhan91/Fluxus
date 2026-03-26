import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'hero',
        pathMatch: 'full',
      },
      {
        path: 'hero',
        loadComponent: () => import('./features/hero/hero.component').then(m => m.HeroComponent),
        data: { tab: { label: 'Welcome', ext: '.tsx', color: '#61dafb' } },
      },
      {
        path: 'about',
        loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
        data: { tab: { label: 'About', ext: '.md', color: '#519aba' } },
      },
      {
        path: 'experience',
        loadComponent: () => import('./features/experience/experience.component').then(m => m.ExperienceComponent),
        data: { tab: { label: 'Experience', ext: '.ts', color: '#3178c6' } },
      },
      {
        path: 'skills',
        loadComponent: () => import('./features/skills/skills.component').then(m => m.SkillsComponent),
        data: { tab: { label: 'Skills', ext: '.json', color: '#cbcb41' } },
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent),
        data: { tab: { label: 'Projects', ext: '.git', color: '#e64a19' } },
      },
      {
        path: 'certifications',
        loadComponent: () => import('./features/certifications/certifications.component').then(m => m.CertificationsComponent),
        data: { tab: { label: 'Certifications', ext: '.pem', color: '#41b883' } },
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
        data: { tab: { label: 'Contact', ext: '.sh', color: '#89e051' } },
      },
      {
        path: 'blog',
        loadComponent: () => import('./features/blog/blog.component').then(m => m.BlogComponent),
        data: { tab: { label: 'Blog', ext: '.rss', color: '#f78c40' } },
      },
    ],
  },
];
