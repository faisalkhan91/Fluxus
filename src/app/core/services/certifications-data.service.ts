import { Injectable, signal } from '@angular/core';
import { Certification, CourseProvider, Award } from '../../shared/models/certification.model';

@Injectable({ providedIn: 'root' })
export class CertificationsDataService {
  readonly certifications = signal<Certification[]>([
    {
      name: 'Microsoft Certified: Azure AI Engineer Associate',
      image:
        'assets/images/achievements/certifications/microsoft-certified-azure-ai-engineer-associate.webp',
      issuer: 'Microsoft',
    },
    {
      name: 'Splunk Cloud Administration',
      image: 'assets/images/achievements/certifications/Splunk_Cloud_Administration_Badge.png',
      issuer: 'Splunk',
    },
    {
      name: 'Microsoft Certified: Security, Compliance, and Identity Fundamentals',
      image:
        'assets/images/achievements/certifications/microsoft-certified-security-compliance-and-identity-fundamentals.png',
      issuer: 'Microsoft',
    },
    {
      name: 'Microsoft Certified: Azure Data Fundamentals',
      image:
        'assets/images/achievements/certifications/microsoft-certified-azure-data-fundamentals.png',
      issuer: 'Microsoft',
    },
    {
      name: 'Microsoft Certified: Azure AI Fundamentals',
      image:
        'assets/images/achievements/certifications/microsoft-certified-azure-ai-fundamentals.png',
      issuer: 'Microsoft',
    },
    {
      name: 'AWS Certified Cloud Practitioner',
      image: 'assets/images/achievements/certifications/aws-certified-cloud-practitioner.png',
      issuer: 'AWS',
    },
    {
      name: 'Microsoft Certified: Azure Fundamentals',
      image: 'assets/images/achievements/certifications/microsoft-certified-azure-fundamentals.png',
      issuer: 'Microsoft',
    },
    {
      name: 'CRLA Level I, II and III',
      image: 'assets/images/achievements/certifications/CRLACertifiedL1.png',
      issuer: 'CRLA',
    },
  ]);

  readonly courseProviders = signal<CourseProvider[]>([
    {
      name: 'Udemy',
      courses: [
        'Master the Coding Interview: Data Structures + Algorithms',
        'Machine Learning A-Z: Hands-On Python & R In Data Science',
        'Jenkins, From Zero To Hero: Become a DevOps Jenkins Master',
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
    {
      name: 'LinkedIn Learning',
      courses: ['Learning Ansible', 'Networking Foundations: Networking Basics'],
    },
  ]);

  readonly awards = signal<Award[]>([
    {
      description:
        'Winner at Charger Startup Weekend, pitching and building a technology prototype in a 54-hour competition.',
    },
    {
      description:
        'Member of Zeta Chapter of Upsilon Pi Epsilon International Honor Society for the Computing and Information Disciplines.',
    },
    {
      description:
        'Received outstanding CLR (Center for Learning Resources) Administrative Staff Award.',
    },
    { description: 'Received Vodafone Star Award for exceptional performance and initiative.' },
    {
      description:
        "Recognized as a 2024 Honored Listee by Marquis Who's Who in America for professional achievement.",
    },
  ]);
}
