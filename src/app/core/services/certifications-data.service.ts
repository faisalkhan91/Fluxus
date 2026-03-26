import { Injectable, signal } from '@angular/core';
import { Certification, CourseProvider, Award } from '../../shared/models/certification.model';

@Injectable({ providedIn: 'root' })
export class CertificationsDataService {
  readonly certifications = signal<Certification[]>([
    { name: 'AWS Certified Cloud Practitioner', image: 'assets/images/achievements/certifications/aws-certified-cloud-practitioner.png', issuer: 'AWS' },
    { name: 'Microsoft Certified: Azure AI Fundamentals', image: 'assets/images/achievements/certifications/microsoft-certified-azure-ai-fundamentals.png', issuer: 'Microsoft' },
    { name: 'Microsoft Certified: Azure Data Fundamentals', image: 'assets/images/achievements/certifications/microsoft-certified-azure-data-fundamentals.png', issuer: 'Microsoft' },
    { name: 'Microsoft Certified: Azure Fundamentals', image: 'assets/images/achievements/certifications/microsoft-certified-azure-fundamentals.png', issuer: 'Microsoft' },
    { name: 'Microsoft Certified: Security, Compliance, and Identity Fundamentals', image: 'assets/images/achievements/certifications/microsoft-certified-security-compliance-and-identity-fundamentals.png', issuer: 'Microsoft' },
    { name: 'CRLA Level I, II and III', image: 'assets/images/achievements/certifications/CRLACertifiedL1.png', issuer: 'CRLA' },
  ]);

  readonly courseProviders = signal<CourseProvider[]>([
    {
      name: 'Udemy',
      courses: [
        'Master the Coding Interview: Data Structures + Algorithms Master',
        'Machine Learning A-Z: Hands-On Python & R In Data Science',
        'Jenkins, From Zero To Hero: Become a DevOps Jenkins Master',
        'Master the Coding Interview: Data Structures + Algorithms',
        'CS101 Learn to Code with Python',
        'HTML 5: Learn HTML 5',
      ],
    },
    {
      name: 'Coursera',
      courses: [
        'Google Cloud Platform Fundamentals: Core Infrastructure',
        'AWS Cloud Practitioner Essentials',
      ],
    },
    {
      name: 'Pluralsight',
      courses: [
        'Microsoft Azure Security and Privacy Concepts',
        'Microsoft Azure Cloud Concepts',
        'Microsoft Azure Pricing and Support Options',
        'Microsoft Azure Services and Concepts',
      ],
    },
    {
      name: 'Skillsoft',
      courses: ['Azure Data Fundamentals: Data Workloads'],
    },
  ]);

  readonly awards = signal<Award[]>([
    { description: 'Member of Zeta Chapter of Upsilon Pi Epsilon International Honor Society for the Computing and Information Disciplines.' },
    { description: 'Received outstanding CLR (Center for Learning Resources) Administrative Staff Award.' },
    { description: 'Received Vodafone Emerging Star award.' },
  ]);
}
