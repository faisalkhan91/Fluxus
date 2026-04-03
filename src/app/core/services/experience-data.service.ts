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
        "Moved internally from Galileo to take on a broader infrastructure mandate, driving cost efficiency across SoFi's multi-cloud footprint.",
        'Driving cloud cost optimization and infrastructure efficiency initiatives across AWS and Azure environments.',
        'Engineering platform-level tooling to surface cost anomalies and enforce resource governance at scale.',
      ],
    },
    {
      type: 'job',
      role: 'Senior Software Engineer, Builder Tools',
      duration: 'April 2025 - April 2026',
      achievements: [
        "Owned SoFi's internal developer experience platform, building Go-based tooling and AI-powered workflows that accelerated engineering velocity across 50+ teams.",
        'Designed and shipped AI-powered developer workflows leveraging Claude, Cursor, and Gemini CLI to automate repetitive infrastructure tasks.',
        'Developed Go-based microservices for internal platform APIs consumed by 50+ engineering teams.',
        'Championed DevOps best practices including GitOps (Argo CD), Terraform IaC, and containerized CI/CD pipelines.',
      ],
    },
    { type: 'period', title: 'Galileo Financial Technologies (A SoFi Company)' },
    {
      type: 'job',
      role: 'Senior Software Engineer, Observability',
      duration: 'April 2024 - March 2025',
      achievements: [
        "Architected and operated the centralized observability platform serving 200+ microservices across Galileo's payment processing infrastructure.",
        'Built monitoring pipelines using Datadog, Grafana, and OpenTelemetry to achieve sub-minute alerting on critical payment flows.',
        'Implemented distributed tracing with Jaeger and OpenTelemetry, reducing mean time to resolution (MTTR) for production incidents.',
        'Developed custom Prometheus exporters and Grafana dashboards to surface SLI/SLO compliance across platform services.',
        'Partnered with SRE teams to establish observability standards and runbooks adopted org-wide.',
      ],
    },
    { type: 'period', title: 'Cigna Healthcare' },
    {
      type: 'job',
      role: 'Senior Software Engineer',
      duration: 'April 2022 - March 2024',
      achievements: [
        'Promoted to lead architecture decisions for enterprise monitoring and automation platforms, mentoring junior engineers and driving the shift to modern observability.',
        'Designed and deployed CI/CD pipelines using Jenkins, Docker, and GitHub Actions, reducing deployment cycle times by 40%.',
        'Owned the Apache Kafka data pipeline running on OpenShift, supporting real-time event streaming for claims processing.',
        'Mentored junior engineers and led knowledge transfer sessions on cloud-native patterns and DevOps practices.',
        'Drove migration of legacy monitoring to modern observability stacks (Splunk, Dynatrace, SolarWinds).',
      ],
    },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'October 2019 - March 2022',
      achievements: [
        'Built and automated enterprise healthcare platforms end-to-end\u2014from Angular frontends and Python scripting to Kafka data pipelines and mainframe monitoring.',
        'Developed and enhanced application features using Angular and RESTful web services for internal healthcare platforms.',
        'Built Python and PowerShell automation scripts that eliminated 20+ hours of manual operations per sprint.',
        'Created custom monitoring frameworks in Python integrated with Splunk for proactive alerting on mainframe systems.',
        'Engineered Selenium-based test automation suites using Python and Katalon, increasing regression test coverage.',
        'Managed Oracle database data flows in Kafka clusters hosted on OpenShift pods and troubleshot production issues.',
        'Approved and deployed releases across all environments using uDeploy as part of regular DevOps activities.',
      ],
    },
    { type: 'period', title: 'DCI Resources, LLC' },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'February 2019 - November 2019',
      achievements: [
        'Drove the containerization and CI/CD modernization effort, migrating applications from monolithic to microservice architecture on Azure.',
        'Developed and maintained automated CI/CD pipelines using Jenkins and GitLab for continuous code deployment.',
        'Built and deployed Docker containers to migrate applications from monolithic to microservice architecture.',
        'Deployed web applications on Azure and automated standard operating procedures with custom Python tooling.',
      ],
    },
    {
      type: 'job',
      role: 'Software Engineer Intern',
      duration: 'September 2018 - January 2019',
      achievements: [
        'Established Git-based version control workflows and supported Azure cloud deployments during an intensive internship.',
        'Implemented branching strategies and contributed to infrastructure automation scripts.',
      ],
    },
    { type: 'period', title: 'University of New Haven' },
    {
      type: 'job',
      role: 'Python Developer',
      duration: 'January 2017 - May 2018',
      achievements: [
        'Delivered full-stack features for student-facing applications using Django, PostgreSQL, and Angular in agile sprints.',
        'Built RESTful API endpoints consumed by the Angular frontend.',
        'Maintained the PostgreSQL database layer and authored Django models for data persistence.',
        "Administered the Linux infrastructure hosting the university's software platform.",
      ],
    },
    {
      type: 'job',
      role: 'Research Assistant',
      duration: 'May 2017 - July 2017',
      achievements: [
        'Processed large-scale NOAA weather datasets using Hadoop MapReduce and built ML models to identify storm occurrence trends.',
        'Visualized results in R Studio and Spyder using R and Python plotting libraries.',
      ],
    },
    { type: 'period', title: 'Vodafone' },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'May 2014 - August 2016',
      achievements: [
        'Managed cloud infrastructure and automated operations at enterprise scale\u2014spanning 100+ backup servers and 15,000 client servers across AWS and VMware.',
        'Wrote Python and shell scripts to automate client package installations across 15,000+ servers.',
        'Managed private cloud environments hosted on VMware ESXi using vSphere web client.',
        'Designed and maintained backup policies (incremental, full, archive log) for Oracle databases using RMAN.',
      ],
    },
    {
      type: 'job',
      role: 'Graduate Engineering Trainee',
      duration: 'February 2014 - April 2014',
      achievements: [
        'Completed intensive onboarding in enterprise infrastructure management, shadowing senior engineers on AWS deployments and VMware administration.',
      ],
    },
    { type: 'period', title: 'Mphasis' },
    {
      type: 'job',
      role: 'System Engineer',
      duration: 'June 2013 - January 2014',
      achievements: [
        'Managed Red Hat Linux and VMware ESX environments for enterprise clients, maintaining 98% uptime through proactive Splunk monitoring and automated patching.',
        'Automated server patching and hotfix deployments using bash scripts.',
      ],
    },
  ]);
}
