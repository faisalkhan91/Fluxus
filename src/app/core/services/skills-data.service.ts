import { Injectable, signal } from '@angular/core';
import { SkillCategory } from '../../shared/models/skill.model';

@Injectable({ providedIn: 'root' })
export class SkillsDataService {
  readonly categories = signal<SkillCategory[]>([
    {
      title: 'Top Skills',
      skills: [
        { name: 'HTML5', iconSrc: 'assets/icons/skills/icons8-html-5.svg' },
        { name: 'CSS3', iconSrc: 'assets/icons/skills/icons8-css3.svg' },
        { name: 'Angular', iconSrc: 'assets/icons/skills/icons8-angularjs.svg' },
        { name: 'Python', iconSrc: 'assets/icons/skills/icons8-python.svg' },
        { name: 'Terraform', iconSrc: 'assets/icons/skills/icons8-terraform.svg' },
        { name: 'Git', iconSrc: 'assets/icons/skills/icons8-git.svg' },
        { name: 'PostgreSQL', iconSrc: 'assets/icons/skills/icons8-postgresql.svg' },
        { name: 'Ansible', iconSrc: 'assets/icons/skills/icons8-ansible.svg' },
        { name: 'Docker', iconSrc: 'assets/icons/skills/icons8-docker.svg' },
        { name: 'GitHub', iconSrc: 'assets/icons/skills/icons8-github.svg' },
        { name: 'Kubernetes', iconSrc: 'assets/icons/skills/icons8-kubernetes.svg' },
        { name: 'OpenShift', iconSrc: 'assets/icons/skills/icons8-openshift.svg' },
        { name: 'Rust', iconSrc: 'assets/icons/skills/icons8-rust-programming-language.svg' },
        { name: 'C#', iconSrc: 'assets/icons/skills/icons8-c-sharp-logo.svg' },
      ],
    },
    {
      title: 'Programming Languages',
      subtitle: 'Proficiency',
      skills: [
        { name: 'HTML', level: 100 },
        { name: 'CSS', level: 95 },
        { name: 'TypeScript', level: 90 },
        { name: 'Python', level: 80 },
        { name: 'SQL', level: 60 },
        { name: 'Angular', level: 78 },
      ],
    },
    {
      title: 'Languages',
      subtitle: 'Communication',
      skills: [
        { name: 'English', level: 100 },
        { name: 'Hindi', level: 100 },
        { name: 'French', level: 66 },
        { name: 'Urdu', level: 50 },
        { name: 'Arabic', level: 33 },
      ],
    },
  ]);
}
