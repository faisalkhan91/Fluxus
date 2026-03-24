import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface SkillIcon {
  src: string;
  name: string;
}

interface ProfessionalSkill {
  name: string;
  percent: string;
}

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.css'],
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent {
  topSkills = signal<SkillIcon[]>([
    { src: 'assets/icons/skills/icons8-html-5.svg', name: 'HTML5' },
    { src: 'assets/icons/skills/icons8-css3.svg', name: 'CSS3' },
    { src: 'assets/icons/skills/icons8-angularjs.svg', name: 'Angular' },
    { src: 'assets/icons/skills/icons8-python.svg', name: 'Python' },
    { src: 'assets/icons/skills/icons8-terraform.svg', name: 'Terraform' },
    { src: 'assets/icons/skills/icons8-git.svg', name: 'Git' },
    { src: 'assets/icons/skills/icons8-postgresql.svg', name: 'PostgreSQL' },
    { src: 'assets/icons/skills/icons8-ansible.svg', name: 'Ansible' },
    { src: 'assets/icons/skills/icons8-docker.svg', name: 'Docker' },
    { src: 'assets/icons/skills/icons8-github.svg', name: 'GitHub' },
    { src: 'assets/icons/skills/icons8-kubernetes.svg', name: 'Kubernetes' },
    { src: 'assets/icons/skills/icons8-openshift.svg', name: 'OpenShift' },
    { src: 'assets/icons/skills/icons8-rust-programming-language.svg', name: 'Rust' },
    { src: 'assets/icons/skills/icons8-c-sharp-logo.svg', name: 'C#' }
  ]);

  programmingLanguages = signal<ProfessionalSkill[]>([
    { name: 'HTML', percent: '100%' },
    { name: 'CSS', percent: '95%' },
    { name: 'TypeScript', percent: '90%' },
    { name: 'Python', percent: '80%' },
    { name: 'SQL', percent: '60%' },
    { name: 'Angular', percent: '78%' }
  ]);

  softSkills = signal<ProfessionalSkill[]>([
    { name: 'English', percent: '100%' },
    { name: 'Hindi', percent: '100%' },
    { name: 'French', percent: '66%' },
    { name: 'Urdu', percent: '50%' },
    { name: 'Arabic', percent: '33%' }
  ]);
}
