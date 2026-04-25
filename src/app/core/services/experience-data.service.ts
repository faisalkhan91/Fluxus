import { Injectable, signal } from '@angular/core';
import { TimelineItem } from '@shared/models/experience.model';

@Injectable({ providedIn: 'root' })
export class ExperienceDataService {
  readonly items = signal<TimelineItem[]>([
    { type: 'period', title: 'SoFi' },
    {
      type: 'job',
      role: 'Senior Software Engineer, Cloud Efficiency',
      duration: 'May 2026 - Present',
      achievements: [
        "Lead cloud efficiency across SoFi's AWS and Azure footprint, building tooling that detects cost anomalies, strengthens governance, and scales AI-native delivery practices.",
      ],
    },
    {
      type: 'job',
      role: 'Senior Software Engineer, Builder Tools',
      duration: 'April 2025 - April 2026',
      achievements: [
        "Led observability cost optimization that delivered hundreds of thousands in annualized Datadog savings, built internal tooling adopted across the team, expanded monitoring across Kubernetes and EC2, and helped advance SoFi's AI-augmented engineering platform.",
      ],
    },
    { type: 'period', title: 'Galileo Financial Technologies (A SoFi Company)' },
    {
      type: 'job',
      role: 'Senior Software Engineer, Observability',
      duration: 'April 2024 - March 2025',
      achievements: [
        'Owned observability for 200+ microservices at Galileo, led a 35+ vendor evaluation for a unified logging platform, selected Coralogix, and helped drive the migration from Splunk and Elastic as Galileo and SoFi infrastructure converged.',
      ],
    },
    { type: 'period', title: 'Cigna Healthcare' },
    {
      type: 'job',
      role: 'Senior Software Engineer',
      duration: 'April 2022 - March 2024',
      achievements: [
        'Promoted to lead architecture for enterprise monitoring in a HIPAA-regulated environment, driving the shift to modern observability platforms, building CI/CD pipelines that cut deployment times by 40%, and owning Kafka-based event streaming for claims processing. Also earned the Azure AI Engineer Associate certification through applied AI work.',
      ],
    },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'October 2019 - March 2022',
      achievements: [
        'Built automation that eliminated 30 hours of manual work per week and became a go-to engineer for platform delivery across applications, monitoring, and data pipelines. Expanded regression coverage and improved alerting for legacy healthcare systems.',
      ],
    },
    { type: 'period', title: 'DCI Resources, LLC' },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'February 2019 - November 2019',
      achievements: [
        'Led containerization and CI/CD modernization, moving monolithic applications to Docker-based services on Azure and establishing automated delivery pipelines.',
      ],
    },
    {
      type: 'job',
      role: 'Software Engineer Intern',
      duration: 'September 2018 - January 2019',
      achievements: [
        "Supported Git workflow adoption and Azure deployments, contributing to the team's early DevOps transformation.",
      ],
    },
    { type: 'period', title: 'University of New Haven' },
    {
      type: 'job',
      role: 'Python Developer',
      duration: 'January 2017 - May 2018',
      achievements: [
        'Built full-stack features for student-facing applications and supported the APIs, data layer, and Linux infrastructure behind them.',
      ],
    },
    {
      type: 'job',
      role: 'Research Assistant',
      duration: 'May 2017 - July 2017',
      achievements: [
        'Analyzed large-scale NOAA weather datasets with Hadoop MapReduce and built machine learning models to identify storm trends.',
      ],
    },
    { type: 'period', title: 'Vodafone' },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'May 2014 - August 2016',
      achievements: [
        'Managed infrastructure at enterprise scale across AWS and VMware, supporting 100+ backup servers and 15,000 client servers while automating fleet operations and database backup policies.',
      ],
    },
    {
      type: 'job',
      role: 'Graduate Engineering Trainee',
      duration: 'February 2014 - April 2014',
      achievements: [
        'Completed an intensive onboarding program in enterprise infrastructure, supporting AWS and VMware deployments and building a foundation in large-scale operations.',
      ],
    },
    { type: 'period', title: 'Mphasis' },
    {
      type: 'job',
      role: 'System Engineer',
      duration: 'June 2013 - January 2014',
      achievements: [
        'Managed Red Hat Linux and VMware ESX environments for enterprise clients, maintaining 98% uptime through proactive monitoring and automated patching.',
      ],
    },
  ]);
}
