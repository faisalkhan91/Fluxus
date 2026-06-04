import { Service, signal } from '@angular/core';
import type { Skill, SkillCategory, SkillTier } from '@shared/models/skill.model';
/* Type-only import avoids a runtime circular dep — `skill-usage.service`
   already imports `SkillsDataService` at runtime. */
import type { SkillUsage } from './skill-usage.service';

@Service()
export class SkillsDataService {
  readonly categories = signal<SkillCategory[]>([
    {
      title: 'Languages & Frameworks',
      skills: [
        {
          name: 'Python',
          iconSrc: 'assets/icons/skills/icons8-python.svg',
          tier: 'core',
          tagline: 'Primary backend language — Django, data tooling, infra glue.',
          since: 2012,
        },
        { name: 'Go', iconSrc: 'assets/icons/skills/go-original.svg', tier: 'core' },
        { name: 'TypeScript', iconSrc: 'assets/icons/skills/typescript-original.svg' },
        {
          name: 'Rust',
          iconSrc: 'assets/icons/skills/icons8-rust-programming-language.svg',
          mono: true,
        },
        { name: 'Angular', iconSrc: 'assets/icons/skills/angular-original.svg' },
        { name: 'JavaScript', iconSrc: 'assets/icons/skills/javascript-original.svg' },
        { name: 'Django', iconSrc: 'assets/icons/skills/icons8-django.svg' },
        {
          name: 'HTML5',
          iconSrc: 'assets/icons/skills/icons8-html-5.svg',
          aliases: ['HTML'],
        },
        {
          name: 'CSS3',
          iconSrc: 'assets/icons/skills/icons8-css3.svg',
          aliases: ['CSS'],
        },
      ],
    },
    {
      title: 'Cloud & Infrastructure',
      skills: [
        {
          name: 'AWS',
          iconSrc: 'assets/icons/skills/amazonwebservices-original-wordmark.svg',
          tier: 'core',
          tagline: 'Day-to-day cloud — EKS, Lambda, RDS, IAM, Bedrock.',
          since: 2015,
        },
        { name: 'Azure', iconSrc: 'assets/icons/skills/azure-original.svg' },
        { name: 'Docker', iconSrc: 'assets/icons/skills/icons8-docker.svg', tier: 'core' },
        { name: 'Kubernetes', iconSrc: 'assets/icons/skills/icons8-kubernetes.svg' },
        { name: 'Terraform', iconSrc: 'assets/icons/skills/icons8-terraform.svg' },
        { name: 'Ansible', iconSrc: 'assets/icons/skills/icons8-ansible.svg' },
        { name: 'OpenShift', iconSrc: 'assets/icons/skills/icons8-openshift.svg' },
        { name: 'Helm', iconSrc: 'assets/icons/skills/helm-original.svg' },
      ],
    },
    {
      title: 'CI/CD & DevOps',
      skills: [
        {
          name: 'GitHub Actions',
          iconSrc: 'assets/icons/skills/githubactions-original.svg',
          tier: 'core',
          tagline: 'Default CI runtime — matrix jobs, caching, reusable workflows.',
          since: 2020,
          mono: true,
        },
        { name: 'ArgoCD', iconSrc: 'assets/icons/skills/argocd-original.svg' },
        { name: 'Git', iconSrc: 'assets/icons/skills/icons8-git.svg', tier: 'core' },
        { name: 'GitHub', iconSrc: 'assets/icons/skills/github-original.svg', mono: true },
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
          tier: 'core',
          tagline: 'Default relational store — schema design, migrations, tuning.',
          since: 2013,
        },
        { name: 'Kafka', iconSrc: 'assets/icons/skills/apachekafka-original.svg', mono: true },
        { name: 'Redis', iconSrc: 'assets/icons/skills/redis-original.svg' },
        { name: 'MongoDB', iconSrc: 'assets/icons/skills/mongodb-original.svg' },
        { name: 'Elasticsearch', iconSrc: 'assets/icons/skills/elasticsearch-original.svg' },
        { name: 'ClickHouse', iconSrc: 'assets/icons/skills/clickhouse-original.svg' },
        { name: 'Snowflake', iconSrc: 'assets/icons/skills/snowflake-original.svg' },
      ],
    },
    {
      title: 'Observability',
      skills: [
        {
          name: 'Datadog',
          iconSrc: 'assets/icons/skills/datadog-original.svg',
          tier: 'core',
          tagline: 'APM, logs, metrics — dashboards, monitors, incident review.',
          since: 2018,
        },
        { name: 'Coralogix', iconSrc: 'assets/icons/skills/coralogix-original.svg' },
        { name: 'OpenTelemetry', iconSrc: 'assets/icons/skills/opentelemetry-original.svg' },
        { name: 'Splunk', iconSrc: 'assets/icons/skills/splunk-original.svg', mono: true },
        { name: 'Prometheus', iconSrc: 'assets/icons/skills/prometheus-original.svg' },
        { name: 'Dynatrace', iconSrc: 'assets/icons/skills/dynatrace-original.svg' },
      ],
    },
    {
      title: 'AI & LLMs',
      skills: [
        {
          name: 'Claude Code',
          iconSrc: 'assets/icons/skills/anthropic-original.svg',
          tier: 'core',
          tagline: 'Daily driver for agentic coding — this site was built with it.',
          since: 2024,
        },
        { name: 'OpenAI', iconSrc: 'assets/icons/skills/openai-original.svg' },
        {
          name: 'GitHub Copilot',
          iconSrc: 'assets/icons/skills/githubcopilot-original.svg',
          tier: 'core',
          mono: true,
        },
        {
          name: 'AWS Bedrock',
          iconSrc: 'assets/icons/skills/amazonwebservices-original-wordmark.svg',
        },
        { name: 'Gemini', iconSrc: 'assets/icons/skills/googlegemini-original.svg' },
        {
          name: 'Cursor',
          iconSrc: 'assets/icons/skills/cursor-original.svg',
          tier: 'core',
          mono: true,
        },
      ],
    },
  ]);
}

/**
 * Resolve a skill's tier. Explicit `skill.tier` wins so depth-of-practice
 * skills without public projects (e.g., team-internal work, or
 * daily-driver tools like Git / Cursor / Docker whose footprint isn't
 * a public artefact) aren't down-ranked by the count threshold alone.
 * Otherwise derive from the number of linked projects: ≥3 = core, 1–2 =
 * working, 0 = learning.
 *
 * The tier surfaces in the list view's tier column and the grid's
 * "dimmed" learning state. The compact `ui-skill-badge` tile is
 * deliberately uniform across tiers (the row of tiles stays
 * scannable; the list view is the place where rank is expressed),
 * so an explicit `tier: 'core'` on a grid-only skill is meaningful
 * even though it doesn't visually distinguish the tile.
 */
export function deriveTier(skill: Skill, usage: SkillUsage | undefined): SkillTier {
  if (skill.tier) return skill.tier;
  const projects = usage?.projects?.length ?? 0;
  if (projects >= 3) return 'core';
  if (projects >= 1) return 'working';
  return 'learning';
}
