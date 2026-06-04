export interface PersonalInfo {
  name: string;
  title: string;
  /**
   * Short role shown in the nav chrome (sidebar + mobile menu identity
   * blocks), where the full `title` is too long. Kept distinct so the
   * compact nav label can diverge from the canonical résumé title.
   */
  navRole: string;
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
