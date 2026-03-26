export interface Skill {
  name: string;
  iconSrc?: string;
  level?: number;
}

export interface SkillCategory {
  title: string;
  subtitle?: string;
  skills: Skill[];
}
