import { Injectable, signal } from '@angular/core';
import { SkillCategory } from '../../shared/models/skill.model';

@Injectable({ providedIn: 'root' })
export class SkillsDataService {
  readonly categories = signal<SkillCategory[]>([
    {
      title: 'Top Skills',
      skills: [
        { name: 'Python', iconSrc: 'assets/icons/skills/icons8-python.svg' },
        { name: 'Angular', iconSrc: 'assets/icons/skills/icons8-angularjs.svg' },
        { name: 'Docker', iconSrc: 'assets/icons/skills/icons8-docker.svg' },
        { name: 'Kubernetes', iconSrc: 'assets/icons/skills/icons8-kubernetes.svg' },
        { name: 'Terraform', iconSrc: 'assets/icons/skills/icons8-terraform.svg' },
        { name: 'Git', iconSrc: 'assets/icons/skills/icons8-git.svg' },
        { name: 'PostgreSQL', iconSrc: 'assets/icons/skills/icons8-postgresql.svg' },
        { name: 'Ansible', iconSrc: 'assets/icons/skills/icons8-ansible.svg' },
        { name: 'GitHub', iconSrc: 'assets/icons/skills/icons8-github.svg' },
        { name: 'OpenShift', iconSrc: 'assets/icons/skills/icons8-openshift.svg' },
        { name: 'Jenkins', iconSrc: 'assets/icons/skills/icons8-jenkins.svg' },
        { name: 'Django', iconSrc: 'assets/icons/skills/icons8-django.svg' },
        { name: 'HTML5', iconSrc: 'assets/icons/skills/icons8-html-5.svg' },
        { name: 'CSS3', iconSrc: 'assets/icons/skills/icons8-css3.svg' },
      ],
    },
    {
      title: 'Programming Languages',
      subtitle: 'Proficiency',
      skills: [
        { name: 'Python', level: 90 },
        { name: 'Go', level: 75 },
        { name: 'TypeScript', level: 85 },
        { name: 'JavaScript', level: 80 },
        { name: 'HTML', level: 100 },
        { name: 'CSS', level: 95 },
        { name: 'SQL', level: 70 },
      ],
    },
    {
      title: 'Languages',
      subtitle: 'Communication',
      skills: [
        { name: 'English', level: 100 },
        { name: 'Hindi', level: 100 },
        { name: 'French', level: 66 },
        { name: 'Urdu', level: 60 },
        { name: 'Arabic', level: 33 },
      ],
    },
  ]);
}
