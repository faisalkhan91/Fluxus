/**
 * Structured icon data, rendered via Angular template binding so every icon
 * appears in the prerendered HTML (good for SEO, view-source, and no-JS
 * visitors). Adding a new icon: add an entry below — only `path`, `line`,
 * `polyline`, `rect`, `circle`, and `polygon` shapes are supported by the
 * template's @switch.
 */
export type IconShape =
  | { tag: 'path'; d: string }
  | { tag: 'line'; x1: string; y1: string; x2: string; y2: string }
  | { tag: 'polyline'; points: string }
  | { tag: 'polygon'; points: string }
  | { tag: 'circle'; cx: string; cy: string; r: string }
  | {
      tag: 'rect';
      x?: string;
      y?: string;
      width: string;
      height: string;
      rx?: string;
      ry?: string;
    };

export const ICONS: Record<string, IconShape[]> = {
  home: [
    { tag: 'path', d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { tag: 'polyline', points: '9 22 9 12 15 12 15 22' },
  ],
  user: [
    { tag: 'path', d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' },
    { tag: 'circle', cx: '12', cy: '7', r: '4' },
  ],
  briefcase: [
    { tag: 'rect', width: '20', height: '14', x: '2', y: '7', rx: '2', ry: '2' },
    { tag: 'path', d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
  ],
  layers: [
    { tag: 'polygon', points: '12 2 2 7 12 12 22 7 12 2' },
    { tag: 'polyline', points: '2 17 12 22 22 17' },
    { tag: 'polyline', points: '2 12 12 17 22 12' },
  ],
  'folder-git': [
    {
      tag: 'path',
      d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    },
    { tag: 'circle', cx: '12', cy: '13', r: '2' },
    { tag: 'path', d: 'M12 15v3' },
  ],
  award: [
    { tag: 'circle', cx: '12', cy: '8', r: '6' },
    { tag: 'path', d: 'M15.477 12.89 17 22l-5-3-5 3 1.523-9.11' },
  ],
  mail: [
    { tag: 'rect', width: '20', height: '16', x: '2', y: '4', rx: '2' },
    { tag: 'path', d: 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' },
  ],
  download: [
    { tag: 'path', d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
    { tag: 'polyline', points: '7 10 12 15 17 10' },
    { tag: 'line', x1: '12', y1: '15', x2: '12', y2: '3' },
  ],
  'external-link': [
    { tag: 'path', d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' },
    { tag: 'polyline', points: '15 3 21 3 21 9' },
    { tag: 'line', x1: '10', y1: '14', x2: '21', y2: '3' },
  ],
  github: [
    {
      tag: 'path',
      d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
    },
    { tag: 'path', d: 'M9 18c-4.51 2-5-2-7-2' },
  ],
  linkedin: [
    {
      tag: 'path',
      d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z',
    },
    { tag: 'rect', width: '4', height: '12', x: '2', y: '9' },
    { tag: 'circle', cx: '4', cy: '4', r: '2' },
  ],
  'map-pin': [
    { tag: 'path', d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' },
    { tag: 'circle', cx: '12', cy: '10', r: '3' },
  ],
  phone: [
    {
      tag: 'path',
      d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    },
  ],
  x: [
    { tag: 'path', d: 'M18 6 6 18' },
    { tag: 'path', d: 'm6 6 12 12' },
  ],
  'chevron-right': [{ tag: 'path', d: 'm9 18 6-6-6-6' }],
  'chevron-down': [{ tag: 'path', d: 'm6 9 6 6 6-6' }],
  menu: [
    { tag: 'line', x1: '4', y1: '12', x2: '20', y2: '12' },
    { tag: 'line', x1: '4', y1: '6', x2: '20', y2: '6' },
    { tag: 'line', x1: '4', y1: '18', x2: '20', y2: '18' },
  ],
  'file-text': [
    { tag: 'path', d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
    { tag: 'polyline', points: '14 2 14 8 20 8' },
    { tag: 'line', x1: '16', y1: '13', x2: '8', y2: '13' },
    { tag: 'line', x1: '16', y1: '17', x2: '8', y2: '17' },
    { tag: 'line', x1: '10', y1: '9', x2: '8', y2: '9' },
  ],
  send: [
    { tag: 'path', d: 'm22 2-7 20-4-9-9-4Z' },
    { tag: 'path', d: 'm22 2-11 11' },
  ],
  share: [
    { tag: 'path', d: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' },
    { tag: 'polyline', points: '16 6 12 2 8 6' },
    { tag: 'line', x1: '12', y1: '2', x2: '12', y2: '15' },
  ],
  sparkles: [
    {
      tag: 'path',
      d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z',
    },
    { tag: 'path', d: 'M5 3v4' },
    { tag: 'path', d: 'M19 17v4' },
    { tag: 'path', d: 'M3 5h4' },
    { tag: 'path', d: 'M17 19h4' },
  ],
  shield: [{ tag: 'path', d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }],
  'arrow-left': [
    { tag: 'line', x1: '19', y1: '12', x2: '5', y2: '12' },
    { tag: 'polyline', points: '12 19 5 12 12 5' },
  ],
  'arrow-right': [
    { tag: 'line', x1: '5', y1: '12', x2: '19', y2: '12' },
    { tag: 'polyline', points: '12 5 19 12 12 19' },
  ],
  'alert-triangle': [
    {
      tag: 'path',
      d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z',
    },
    { tag: 'line', x1: '12', y1: '9', x2: '12', y2: '13' },
    { tag: 'line', x1: '12', y1: '17', x2: '12.01', y2: '17' },
  ],
  calendar: [
    { tag: 'rect', width: '18', height: '18', x: '3', y: '4', rx: '2', ry: '2' },
    { tag: 'line', x1: '16', y1: '2', x2: '16', y2: '6' },
    { tag: 'line', x1: '8', y1: '2', x2: '8', y2: '6' },
    { tag: 'line', x1: '3', y1: '10', x2: '21', y2: '10' },
  ],
  clock: [
    { tag: 'circle', cx: '12', cy: '12', r: '10' },
    { tag: 'polyline', points: '12 6 12 12 16 14' },
  ],
  rss: [
    { tag: 'path', d: 'M4 11a9 9 0 0 1 9 9' },
    { tag: 'path', d: 'M4 4a16 16 0 0 1 16 16' },
    { tag: 'circle', cx: '5', cy: '19', r: '1' },
  ],
  sun: [
    { tag: 'circle', cx: '12', cy: '12', r: '5' },
    { tag: 'line', x1: '12', y1: '1', x2: '12', y2: '3' },
    { tag: 'line', x1: '12', y1: '21', x2: '12', y2: '23' },
    { tag: 'line', x1: '4.22', y1: '4.22', x2: '5.64', y2: '5.64' },
    { tag: 'line', x1: '18.36', y1: '18.36', x2: '19.78', y2: '19.78' },
    { tag: 'line', x1: '1', y1: '12', x2: '3', y2: '12' },
    { tag: 'line', x1: '21', y1: '12', x2: '23', y2: '12' },
    { tag: 'line', x1: '4.22', y1: '19.78', x2: '5.64', y2: '18.36' },
    { tag: 'line', x1: '18.36', y1: '5.64', x2: '19.78', y2: '4.22' },
  ],
  moon: [{ tag: 'path', d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }],
};
