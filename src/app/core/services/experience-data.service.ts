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
        "After a year building SoFi's developer platform, I moved internally to tackle a broader infrastructure challenge: driving cost efficiency across the company's multi-cloud footprint spanning AWS and Azure. I now engineer platform-level tooling that surfaces cost anomalies in near-real-time and enforces resource governance at scale, ensuring that as SoFi's financial services platform grows, infrastructure spend stays accountable and optimized.",
      ],
    },
    {
      type: 'job',
      role: 'Senior Software Engineer, Builder Tools',
      duration: 'April 2025 - April 2026',
      achievements: [
        "I owned SoFi's internal developer experience platform, the central tooling layer that 50+ engineering teams relied on daily. My focus was twofold: building Go-based microservices that powered the platform's self-service APIs, and designing AI-powered workflows using Claude, Cursor, and Gemini CLI to automate repetitive infrastructure tasks. I championed GitOps through Argo CD, codified infrastructure with Terraform, and pushed for containerized CI/CD pipelines that brought consistency and velocity to the release process across the organization.",
      ],
    },
    { type: 'period', title: 'Galileo Financial Technologies (A SoFi Company)' },
    {
      type: 'job',
      role: 'Senior Software Engineer, Observability',
      duration: 'April 2024 - March 2025',
      achievements: [
        "At Galileo, SoFi's B2B payment processing arm powering billions in transactions for fintech clients worldwide, I architected and operated the centralized observability platform serving 200+ microservices. I built monitoring pipelines using Datadog, Grafana, and OpenTelemetry to achieve sub-minute alerting on critical payment flows, and implemented distributed tracing with Jaeger that meaningfully reduced mean time to resolution for production incidents.",
        'Beyond instrumentation, I developed custom Prometheus exporters and Grafana dashboards that surfaced SLI/SLO compliance across platform services, giving engineering leadership clear visibility into system health. I partnered closely with SRE teams to establish observability standards and runbooks that were adopted organization-wide, creating a shared language for reliability across Galileo.',
      ],
    },
    { type: 'period', title: 'Cigna Healthcare' },
    {
      type: 'job',
      role: 'Senior Software Engineer',
      duration: 'April 2022 - March 2024',
      achievements: [
        "Promoted to lead architecture decisions for Cigna's enterprise monitoring and automation platforms, I operated in a HIPAA-regulated environment where the stakes were high and reliability was non-negotiable. I drove the organization's migration from legacy monitoring to modern observability stacks (Splunk, Dynatrace, and SolarWinds) while mentoring junior engineers and leading knowledge transfer sessions on cloud-native patterns and DevOps practices.",
        'I designed and deployed CI/CD pipelines using Jenkins, Docker, and GitHub Actions that cut deployment cycle times by 40%, and owned the Apache Kafka data pipeline running on OpenShift that supported real-time event streaming for claims processing. This period sharpened my ability to balance technical leadership with hands-on delivery in a heavily regulated enterprise.',
      ],
    },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'October 2019 - March 2022',
      achievements: [
        "I joined Cigna's platform engineering team and quickly became the go-to engineer for end-to-end automation, from Angular frontends and Python scripting to Kafka data pipelines and mainframe monitoring. I built Python and PowerShell automation scripts that eliminated 20+ hours of manual operations per sprint, and created custom monitoring frameworks integrated with Splunk for proactive alerting on legacy mainframe systems.",
        'On the application side, I developed and enhanced features using Angular and RESTful web services for internal healthcare platforms, while engineering Selenium-based test automation suites with Python and Katalon that significantly expanded regression coverage. I managed Oracle database data flows in Kafka clusters hosted on OpenShift and handled release approvals across environments using uDeploy, building the broad, systems-level perspective that defined my later career.',
      ],
    },
    { type: 'period', title: 'DCI Resources, LLC' },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'February 2019 - November 2019',
      achievements: [
        'I drove the containerization and CI/CD modernization effort at DCI, a minority-owned IT services firm specializing in enterprise support. I migrated applications from monolithic architecture to Docker-based microservices deployed on Azure, built automated pipelines using Jenkins and GitLab, and developed custom Python tooling that replaced manual standard operating procedures with repeatable, version-controlled automation.',
      ],
    },
    {
      type: 'job',
      role: 'Software Engineer Intern',
      duration: 'September 2018 - January 2019',
      achievements: [
        "During an intensive internship, I established Git-based version control workflows and supported Azure cloud deployments, implementing branching strategies and contributing to infrastructure automation scripts that laid the groundwork for the team's DevOps transformation.",
      ],
    },
    { type: 'period', title: 'University of New Haven' },
    {
      type: 'job',
      role: 'Python Developer',
      duration: 'January 2017 - May 2018',
      achievements: [
        "As part of my graduate studies, I served as a developer for the university's student-facing applications, delivering full-stack features using Django, PostgreSQL, and Angular in agile sprints. I built RESTful API endpoints consumed by the Angular frontend, maintained the PostgreSQL database layer and Django ORM models, and administered the Linux infrastructure hosting the platform.",
      ],
    },
    {
      type: 'job',
      role: 'Research Assistant',
      duration: 'May 2017 - July 2017',
      achievements: [
        'I processed large-scale NOAA weather datasets using Hadoop MapReduce and built machine learning models to identify storm occurrence trends, visualizing the results using R and Python plotting libraries. This was my first exposure to data engineering at scale and reinforced my interest in building systems that turn raw data into actionable insight.',
      ],
    },
    { type: 'period', title: 'Vodafone' },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'May 2014 - August 2016',
      achievements: [
        "At Vodafone, one of the world's largest telecommunications companies, I managed cloud infrastructure and automated operations at true enterprise scale: 100+ backup servers and 15,000 client servers across AWS and VMware environments. I wrote Python and shell scripts to automate package installations across the entire fleet, managed private cloud environments on VMware ESXi, and designed backup policies for Oracle databases using RMAN. Working at this scale taught me that good automation is not optional; it is survival.",
      ],
    },
    {
      type: 'job',
      role: 'Graduate Engineering Trainee',
      duration: 'February 2014 - April 2014',
      achievements: [
        'Completed an intensive onboarding program in enterprise infrastructure management, shadowing senior engineers on AWS deployments and VMware administration. This period built the operational foundation that my subsequent infrastructure engineering career was built on.',
      ],
    },
    { type: 'period', title: 'Mphasis' },
    {
      type: 'job',
      role: 'System Engineer',
      duration: 'June 2013 - January 2014',
      achievements: [
        'I launched my career at Mphasis, a Blackstone-backed enterprise IT services firm, managing Red Hat Linux and VMware ESX environments for enterprise clients. I maintained 98% uptime through proactive Splunk monitoring and automated server patching and hotfix deployments using bash scripts, learning early that reliability is earned through automation, not heroics.',
      ],
    },
  ]);
}
