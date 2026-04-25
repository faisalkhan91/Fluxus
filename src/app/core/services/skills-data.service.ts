import { Injectable, signal } from '@angular/core';
import { SkillCategory } from '@shared/models/skill.model';

@Injectable({ providedIn: 'root' })
export class SkillsDataService {
  readonly categories = signal<SkillCategory[]>([
    {
      title: 'Languages & Frameworks',
      skills: [
        { name: 'Python', iconSrc: 'assets/icons/skills/icons8-python.svg' },
        { name: 'Go', iconSrc: 'assets/icons/skills/go-original.svg' },
        {
          name: 'TypeScript',
          iconSrc: 'assets/icons/skills/typescript-original.svg',
        },
        { name: 'Rust', iconSrc: 'assets/icons/skills/icons8-rust-programming-language.svg' },
        { name: 'Angular', iconSrc: 'assets/icons/skills/icons8-angularjs.svg' },
        {
          name: 'JavaScript',
          iconSrc: 'assets/icons/skills/javascript-original.svg',
        },
        { name: 'Django', iconSrc: 'assets/icons/skills/icons8-django.svg' },
        { name: 'HTML5', iconSrc: 'assets/icons/skills/icons8-html-5.svg' },
        { name: 'CSS3', iconSrc: 'assets/icons/skills/icons8-css3.svg' },
      ],
    },
    {
      title: 'Cloud & Infrastructure',
      skills: [
        {
          name: 'AWS',
          iconSrc: 'assets/icons/skills/amazonwebservices-original-wordmark.svg',
        },
        { name: 'Azure', iconSrc: 'assets/icons/skills/azure-original.svg' },
        { name: 'Docker', iconSrc: 'assets/icons/skills/icons8-docker.svg' },
        {
          name: 'Kubernetes',
          iconSrc: 'assets/icons/skills/icons8-kubernetes.svg',
        },
        {
          name: 'Terraform',
          iconSrc: 'assets/icons/skills/icons8-terraform.svg',
        },
        { name: 'Ansible', iconSrc: 'assets/icons/skills/icons8-ansible.svg' },
        {
          name: 'OpenShift',
          iconSrc: 'assets/icons/skills/icons8-openshift.svg',
        },
        { name: 'Helm', iconSrc: 'assets/icons/skills/helm-original.svg' },
      ],
    },
    {
      title: 'CI/CD & DevOps',
      skills: [
        {
          name: 'GitHub Actions',
          iconSrc: 'assets/icons/skills/icons8-github.svg',
        },
        { name: 'ArgoCD', iconSrc: 'assets/icons/skills/argocd-original.svg' },
        { name: 'Git', iconSrc: 'assets/icons/skills/icons8-git.svg' },
        { name: 'GitHub', iconSrc: 'assets/icons/skills/icons8-github.svg' },
        { name: 'Jenkins', iconSrc: 'assets/icons/skills/icons8-jenkins.svg' },
        { name: 'GitLab', iconSrc: 'assets/icons/skills/gitlab-original.svg' },
        { name: 'Flux CD', iconSrc: 'assets/icons/skills/flux-original.svg' },
      ],
    },
    {
      title: 'Data & Storage',
      skills: [
        {
          name: 'PostgreSQL',
          iconSrc: 'assets/icons/skills/icons8-postgresql.svg',
        },
        {
          name: 'Kafka',
          iconSrc: 'assets/icons/skills/apachekafka-original.svg',
        },
        { name: 'Redis', iconSrc: 'assets/icons/skills/redis-original.svg' },
        {
          name: 'MongoDB',
          iconSrc: 'assets/icons/skills/mongodb-original.svg',
        },
        {
          name: 'Elasticsearch',
          iconSrc: 'assets/icons/skills/elasticsearch-original.svg',
        },
        {
          name: 'ClickHouse',
          iconSrc: 'assets/icons/skills/clickhouse-original.svg',
        },
        {
          name: 'Snowflake',
          iconSrc: 'assets/icons/skills/snowflake-original.svg',
        },
      ],
    },
    {
      title: 'Observability',
      skills: [
        {
          name: 'Datadog',
          iconSrc: 'assets/icons/skills/datadog-original.svg',
        },
        {
          name: 'Coralogix',
          iconSrc: 'assets/icons/skills/coralogix-original.svg',
        },
        {
          name: 'OpenTelemetry',
          iconSrc: 'assets/icons/skills/opentelemetry-original.svg',
        },
        { name: 'Splunk', iconSrc: 'assets/icons/skills/splunk-original.svg' },
        {
          name: 'Prometheus',
          iconSrc: 'assets/icons/skills/prometheus-original.svg',
        },
        {
          name: 'Dynatrace',
          iconSrc: 'assets/icons/skills/dynatrace-original.svg',
        },
      ],
    },
    {
      title: 'AI & LLMs',
      skills: [
        { name: 'OpenAI', iconSrc: 'assets/icons/skills/openai-original.svg' },
        {
          name: 'GitHub Copilot',
          iconSrc: 'assets/icons/skills/githubcopilot-original.svg',
        },
        {
          name: 'AWS Bedrock',
          iconSrc: 'assets/icons/skills/amazonwebservices-original-wordmark.svg',
        },
        {
          name: 'Gemini',
          iconSrc: 'assets/icons/skills/googlegemini-original.svg',
        },
        {
          name: 'Cursor',
          iconSrc: 'assets/icons/skills/cursor-original.svg',
        },
        {
          name: 'Claude Code',
          iconSrc: 'assets/icons/skills/anthropic-original.svg',
        },
      ],
    },
  ]);
}
