import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface Certification {
  src: string;
  name: string;
}

interface CourseProvider {
  name: string;
  courses: string[];
}

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.css'],
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementsComponent {
  certifications = signal<Certification[]>([
    { src: 'assets/images/achievements/certifications/aws-certified-cloud-practitioner.png', name: 'AWS Certified Cloud Practitioner' },
    { src: 'assets/images/achievements/certifications/microsoft-certified-azure-ai-fundamentals.png', name: 'Microsoft Certified: Azure AI Fundamentals' },
    { src: 'assets/images/achievements/certifications/microsoft-certified-azure-data-fundamentals.png', name: 'Microsoft Certified: Azure Data Fundamentals' },
    { src: 'assets/images/achievements/certifications/microsoft-certified-azure-fundamentals.png', name: 'Microsoft Certified: Azure Fundamentals' },
    { src: 'assets/images/achievements/certifications/microsoft-certified-security-compliance-and-identity-fundamentals.png', name: 'Microsoft Certified: Security, Compliance, and Identity Fundamentals' }
  ]);

  otherCerts = signal<Certification[]>([
    { src: 'assets/images/achievements/certifications/CRLACertifiedL1.png', name: 'CRLA Level I, II and III' }
  ]);

  courseProviders = signal<CourseProvider[]>([
    {
      name: 'Udemy',
      courses: [
        'Master the Coding Interview: Data Structures + Algorithms Master',
        'Machine Learning A-Z™: Hands-On Python & R In Data Science',
        'Jenkins, From Zero To Hero: Become a DevOps Jenkins Master',
        'Master the Coding Interview: Data Structures + Algorithms',
        'CS101 Learn to Code with Python',
        'HTML 5: Learn HTML 5'
      ]
    },
    {
      name: 'Coursera',
      courses: [
        'Google Cloud Platform Fundamentals: Core Infrastructure',
        'AWS Cloud Practitioner Essentials'
      ]
    },
    {
      name: 'Pluralsight',
      courses: [
        'Microsoft Azure Security and Privacy Concepts',
        'Microsoft Azure Cloud Concepts',
        'Microsoft Azure Pricing and Support Options',
        'Microsoft Azure Services and Concepts'
      ]
    },
    {
      name: 'Skillsoft',
      courses: [
        'Azure Data Fundamentals: Data Workloads'
      ]
    }
  ]);

  awards = signal<string[]>([
    'Member of Zeta Chapter of Upsilon Pi Epsilon International Honor Society for the Computing and Information Disciplines.',
    'Received outstanding CLR (Center for Learning Resources) Administrative Staff Award.',
    'Received Vodafone Emerging Star award.'
  ]);
}
