export interface TimelineItem {
  type: 'period' | 'job';
  title?: string;
  role?: string;
  duration?: string;
  achievements?: string[];
}
