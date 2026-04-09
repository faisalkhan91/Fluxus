import { Injectable, signal } from '@angular/core';
import { TimelineItem } from '../../shared/models/experience.model';

@Injectable({ providedIn: 'root' })
export class ExperienceDataService {
  readonly items = signal<TimelineItem[]>([
    { type: 'period', title: 'SoFi' },
    {
      type: 'job',
      role: 'Senior Software Engineer, Cloud Efficiency',
      duration: 'May 2026 - Present',
      achievements: [
        "Lead cloud efficiency initiatives across SoFi's AWS and Azure footprint, building tooling that identifies cost anomalies in near real time, strengthens resource governance, and accelerates delivery through AI-native engineering practices.",
      ],
    },
    {
      type: 'job',
      role: 'Senior Software Engineer, Builder Tools',
      duration: 'April 2025 - April 2026',
      achievements: [
        "Led observability cost optimization initiatives that delivered hundreds of thousands in annualized Datadog savings, built internal tooling that became standard across the team, expanded monitoring infrastructure across Kubernetes and EC2, and helped advance SoFi's AI-augmented engineering capabilities through internal platform and workflow tooling.",
      ],
    },
    { type: 'period', title: 'Galileo Financial Technologies (A SoFi Company)' },
    {
      type: 'job',
      role: 'Senior Software Engineer, Observability',
      duration: 'April 2024 - March 2025',
      achievements: [
        'Owned the observability platform for 200+ microservices at Galileo, led the evaluation of 35+ vendors for a unified logging platform, selected Coralogix, and helped drive the migration from Splunk and Elastic as Galileo and SoFi infrastructure converged. Also built a Python logging library adopted across multiple teams.',
      ],
    },
    { type: 'period', title: 'Cigna Healthcare' },
    {
      type: 'job',
      role: 'Senior Software Engineer',
      duration: 'April 2022 - March 2024',
      achievements: [
        'Promoted to lead architecture for enterprise monitoring in a HIPAA-regulated environment, driving the migration to modern observability platforms, building CI/CD pipelines that cut deployment times by 40%, and owning Kafka-based event streaming for claims processing. Earned the Azure AI Engineer Associate certification through applied work in computer vision, NLP, and generative AI.',
      ],
    },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'October 2019 - March 2022',
      achievements: [
        'Built automation that eliminated 30 hours of manual work per week and became the go-to engineer for platform delivery spanning application development, monitoring, and data pipelines. Expanded regression coverage across internal healthcare platforms and developed custom alerting for legacy systems.',
      ],
    },
    { type: 'period', title: 'DCI Resources, LLC' },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'February 2019 - November 2019',
      achievements: [
        'Led containerization and CI/CD modernization, moving monolithic applications to Docker-based services on Azure and establishing automated Jenkins and GitLab delivery pipelines.',
      ],
    },
    {
      type: 'job',
      role: 'Software Engineer Intern',
      duration: 'September 2018 - January 2019',
      achievements: [
        "Helped establish Git workflows and support Azure deployments, contributing to the team's early DevOps transformation.",
      ],
    },
    { type: 'period', title: 'University of New Haven' },
    {
      type: 'job',
      role: 'Python Developer',
      duration: 'January 2017 - May 2018',
      achievements: [
        'Delivered full-stack features for student-facing applications using Django, PostgreSQL, and Angular, building REST APIs and supporting the underlying Linux infrastructure.',
      ],
    },
    {
      type: 'job',
      role: 'Research Assistant',
      duration: 'May 2017 - July 2017',
      achievements: [
        'Analyzed large-scale NOAA weather datasets with Hadoop MapReduce and built machine learning models to identify storm trends, visualizing results with R and Python.',
      ],
    },
    { type: 'period', title: 'Vodafone' },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'May 2014 - August 2016',
      achievements: [
        'Managed infrastructure at enterprise scale across AWS and VMware, supporting 100+ backup servers and 15,000 client servers. Automated fleet operations with Python and shell scripting and designed Oracle database backup policies using RMAN.',
      ],
    },
    {
      type: 'job',
      role: 'Graduate Engineering Trainee',
      duration: 'February 2014 - April 2014',
      achievements: [
        'Completed an intensive onboarding program in enterprise infrastructure, supporting AWS and VMware deployments and building the operational foundation for my later infrastructure work.',
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
