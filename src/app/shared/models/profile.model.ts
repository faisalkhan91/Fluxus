export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  linkedIn: string;
  github: string;
  avatar: string;
  bio: string[];
}

export interface Education {
  year: string;
  degree: string;
  institution: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  label: string;
}
