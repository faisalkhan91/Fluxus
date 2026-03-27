import { Injectable, signal } from '@angular/core';
import { PersonalInfo, Education, SocialLink } from '../../shared/models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileDataService {
  readonly personalInfo = signal<PersonalInfo>({
    name: 'Faisal Khan',
    title: 'Software Engineer',
    email: 'faisalkhan91@gmail.com',
    phone: '+1 (475)-355-7575',
    website: 'http://faisalkhan.serveblog.net',
    location: 'New Haven, CT, USA',
    linkedIn: 'https://www.linkedin.com/in/faisalkhan91/',
    github: 'https://github.com/faisalkhan91',
    avatar: 'assets/images/profile/profile_picture.jpg',
    bio: [
      'Software Engineer with deep expertise in full-stack development, cloud architecture, AI/ML, and DevOps. I build robust, scalable systems and thrive on solving complex technical challenges.',
      'My work spans enterprise platforms at SoFi and Cigna Healthcare, open-source projects, and cloud-native infrastructure. I bring a strong foundation in computer science with a Master\'s from the University of New Haven.',
      'I\'m passionate about continuous learning, automation, and creating innovative solutions that exceed expectations. Currently exploring AI integration, observability systems, and modern frontend architecture.',
    ],
  });

  readonly education = signal<Education[]>([
    { year: '2019', degree: 'Master of Science, Computer Science', institution: 'University of New Haven, CT, USA' },
    { year: '2013', degree: 'Bachelor of Science, Electrical Engineering', institution: 'VIT, Pune, Maharashtra, India' },
  ]);

  readonly socialLinks = signal<SocialLink[]>([
    { platform: 'GitHub', url: 'https://github.com/faisalkhan91', icon: 'github', label: 'GitHub Profile' },
    { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/faisalkhan91/', icon: 'linkedin', label: 'LinkedIn Profile' },
  ]);
}
