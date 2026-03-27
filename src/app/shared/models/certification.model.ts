export interface Certification {
  name: string;
  image: string;
  issuer?: string;
}

export interface CourseProvider {
  name: string;
  courses: string[];
}

export interface Award {
  description: string;
}
