import { Injectable, signal } from '@angular/core';
import { PersonalInfo, Education, SocialLink } from '../../shared/models/profile.model';
import { yearsOfExperience } from '../../shared/utils/career.utils';

@Injectable({ providedIn: 'root' })
export class ProfileDataService {
  readonly personalInfo = signal<PersonalInfo>({
    name: 'Faisal Khan',
    title: 'Senior Software Engineer',
    email: 'faisalkhan91@gmail.com',
    phone: '+1 (475)-355-7575',
    website: 'http://faisalkhan.serveblog.net',
    location: 'Kirkland, WA, USA',
    linkedIn: 'https://www.linkedin.com/in/faisalkhan91/',
    github: 'https://github.com/faisalkhan91',
    avatar: 'assets/images/profile/profile_picture.jpg',
    bio: [
      `Senior Software Engineer with ${yearsOfExperience()}+ years of experience architecting end-to-end systems - from core infrastructure and data pipelines to backend services and front-end design. My work across fintech, healthcare, and telecom has shaped a pragmatic approach to building software that is powerful, reliable, and scalable.`,
      'Currently focused on the intersection of AI and platform engineering. I develop AI agents and build internal tooling with Go, leveraging the modern AI toolkit (Claude, Cursor, Gemini CLI) to deliver results faster. Grounded in DevOps culture, I utilize Python, Go, AWS, Azure, Kubernetes, Docker, and Terraform to create cohesive, high-performance systems.',
      "My career spans leadership roles at SoFi, Galileo Financial Technologies, and Cigna Healthcare, backed by a Master's in Computer Science from the University of New Haven. I'm passionate about continuous learning, automation, and finding innovative solutions to complex technical challenges.",
    ],
  });

  readonly education = signal<Education[]>([
    {
      year: '2019',
      degree: 'Master of Science, Computer Science',
      institution: 'University of New Haven, West Haven, CT, USA',
    },
    {
      year: '2013',
      degree: 'Bachelor of Technology, Electronics and Telecommunications Engineering',
      institution: 'Vishwakarma Institute of Technology, Pune, Maharashtra, India',
    },
  ]);

  readonly socialLinks = signal<SocialLink[]>([
    {
      platform: 'GitHub',
      url: 'https://github.com/faisalkhan91',
      icon: 'github',
      label: 'GitHub Profile',
    },
    {
      platform: 'LinkedIn',
      url: 'https://www.linkedin.com/in/faisalkhan91/',
      icon: 'linkedin',
      label: 'LinkedIn Profile',
    },
    {
      platform: 'Credly',
      url: 'https://www.credly.com/users/faisalkhan91',
      icon: 'shield',
      label: 'Credly Certifications',
    },
  ]);
}
