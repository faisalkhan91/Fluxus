import { Routes } from '@angular/router';
import { yearsOfExperience } from './shared/utils/career.utils';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/hero/hero.component').then((m) => m.HeroComponent),
        pathMatch: 'full',
        data: {
          tab: { label: 'Welcome', ext: '.tsx', color: '#61dafb' },
          seo: {
            title: 'Welcome',
            description: `Faisal Khan - Senior Software Engineer with ${yearsOfExperience()}+ years of experience in Full-Stack Development, Cloud Architecture, AI, and DevOps.`,
          },
        },
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/about/about.component').then((m) => m.AboutComponent),
        data: {
          tab: { label: 'About', ext: '.md', color: '#519aba' },
          seo: {
            title: 'About',
            description:
              'Background, education, and professional journey of Faisal Khan - Senior Software Engineer.',
          },
        },
      },
      {
        path: 'experience',
        loadComponent: () =>
          import('./features/experience/experience.component').then((m) => m.ExperienceComponent),
        data: {
          tab: { label: 'Experience', ext: '.ts', color: '#3178c6' },
          seo: {
            title: 'Experience',
            description: `${yearsOfExperience()}+ years of professional experience across SoFi, Galileo, Cigna Healthcare, and more.`,
          },
        },
      },
      {
        path: 'skills',
        loadComponent: () =>
          import('./features/skills/skills.component').then((m) => m.SkillsComponent),
        data: {
          tab: { label: 'Skills', ext: '.json', color: '#cbcb41' },
          seo: {
            title: 'Skills',
            description:
              'Technical skills in full-stack development, cloud architecture, AI, and DevOps.',
          },
        },
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/projects.component').then((m) => m.ProjectsComponent),
        data: {
          tab: { label: 'Projects', ext: '.git', color: '#e64a19' },
          seo: {
            title: 'Projects',
            description:
              'Open-source and professional projects by Faisal Khan - from full-stack apps to CI/CD pipelines.',
          },
        },
      },
      {
        path: 'certifications',
        loadComponent: () =>
          import('./features/certifications/certifications.component').then(
            (m) => m.CertificationsComponent,
          ),
        data: {
          tab: { label: 'Certifications', ext: '.pem', color: '#41b883' },
          seo: {
            title: 'Certifications',
            description:
              'Professional certifications in AWS, Azure, Google Cloud, and industry recognition.',
          },
        },
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/contact/contact.component').then((m) => m.ContactComponent),
        data: {
          tab: { label: 'Contact', ext: '.sh', color: '#89e051' },
          seo: {
            title: 'Contact',
            description: 'Get in touch with Faisal Khan for opportunities and collaboration.',
          },
        },
      },
      {
        path: 'blog',
        loadComponent: () => import('./features/blog/blog.component').then((m) => m.BlogComponent),
        data: {
          tab: { label: 'Blog', ext: '.rss', color: '#f78c40' },
          seo: {
            title: 'Blog',
            description:
              'Technical articles and insights on software engineering, cloud, AI, and DevOps.',
          },
        },
      },
      {
        path: 'blog/:slug',
        loadComponent: () =>
          import('./features/blog/blog-post/blog-post.component').then((m) => m.BlogPostComponent),
        data: {
          tab: { label: 'Blog', ext: '.rss', color: '#f78c40' },
          seo: { dynamicMeta: true },
        },
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
        data: {
          tab: { label: '404', ext: '.err', color: '#e06c75' },
          seo: {
            title: '404 Not Found',
            description: 'The page you are looking for does not exist.',
          },
        },
      },
    ],
  },
];
