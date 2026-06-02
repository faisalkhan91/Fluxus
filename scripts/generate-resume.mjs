import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, '..', 'src', 'assets', 'resume.pdf');

const ACCENT = '#c92a2a';
const TEXT = '#1a1a1a';
const MUTED = '#555555';
const RULE = '#cccccc';
const LINK = '#2563eb';

const MARGIN = 48;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COL_GAP = 24;
const LEFT_COL = CONTENT_WIDTH * 0.62;
const RIGHT_COL = CONTENT_WIDTH - LEFT_COL - COL_GAP;

// Mirrors yearsOfExperience() in src/app/shared/utils/career.utils.ts
// (CAREER_START = May 2013). Kept as a local copy because a plain .mjs
// build script can't import the .ts util without a transpile step; the
// start month + calendar-diff math are matched so the resume never
// disagrees with the site by a year at a month boundary.
const CAREER_START = new Date(2013, 4); // May 2013
const yearsOfExperience = () => {
  const now = new Date();
  let years = now.getFullYear() - CAREER_START.getFullYear();
  if (now.getMonth() < CAREER_START.getMonth()) years--;
  return years;
};

// Resume content is an intentionally CURATED subset of the canonical data
// in src/app/core/services/{experience,profile,certifications}-data.service.ts
// — early-career / intern / research roles are condensed and summaries are
// rewritten in a tighter resume register. It is deliberately NOT generated
// from those services; keep the two in rough sync by hand when the live
// data changes.
const experience = [
  {
    company: 'SoFi',
    role: 'Senior Software Engineer, Cloud Efficiency',
    dates: 'May 2026 - Present',
    summary: 'Multi-cloud cost optimization and resource governance at scale.',
  },
  {
    company: 'SoFi',
    role: 'Senior Software Engineer, Builder Tools',
    dates: 'Apr 2025 - Apr 2026',
    summary:
      'Led Datadog cost optimization (six-figure annualized savings), built AI-augmented observability tooling in Go and Python, deployed monitoring infrastructure across Kubernetes and EC2.',
  },
  {
    company: 'Galileo Financial Technologies',
    role: 'Senior Software Engineer, Observability',
    dates: 'Apr 2024 - Mar 2025',
    summary:
      'Owned observability for 200+ microservices. Led unified logging platform evaluation (35+ vendors), recommended and drove Coralogix adoption company-wide.',
  },
  {
    company: 'Cigna Healthcare',
    role: 'Senior Software Engineer',
    dates: 'Apr 2022 - Mar 2024',
    summary:
      'Architecture lead for enterprise monitoring in a HIPAA environment. Cut deployment cycles 40% with CI/CD automation. Built AI applications with Azure AI services.',
  },
  {
    company: 'Cigna Healthcare',
    role: 'Software Engineer',
    dates: 'Oct 2019 - Mar 2022',
    summary:
      'End-to-end platform automation across Angular, Python, Kafka, and mainframe systems. Eliminated 30+ hours/week of manual operations.',
  },
  {
    company: 'DCI Resources',
    role: 'Software Engineer',
    dates: 'Feb 2019 - Nov 2019',
    summary: 'Containerization and CI/CD modernization on Azure.',
  },
  {
    company: 'Vodafone',
    role: 'Software Engineer',
    dates: 'May 2014 - Aug 2016',
    summary:
      'Cloud infrastructure and automation at enterprise scale (15,000+ servers). VMware, AWS, Oracle RMAN.',
  },
  {
    company: 'Mphasis',
    role: 'System Engineer',
    dates: 'Jun 2013 - Jan 2014',
    summary:
      'Linux and VMware administration. 98% uptime via Splunk monitoring and automated patching.',
  },
];

const skills = [
  'Python',
  'Go',
  'TypeScript',
  'Angular',
  'Django',
  'Docker',
  'Kubernetes',
  'Terraform',
  'AWS',
  'Azure',
  'Datadog',
  'Splunk',
  'Jenkins',
  'Git',
  'PostgreSQL',
  'OpenShift',
  'Ansible',
  'Kafka',
  'AI/LLM Engineering',
];

const certifications = [
  'Azure AI Engineer Associate',
  'Splunk Cloud Administration',
  'AWS Certified Cloud Practitioner',
  'Azure Data Fundamentals',
  'Azure AI Fundamentals',
  'Security, Compliance, and Identity Fundamentals',
  'Azure Fundamentals',
];

const education = [
  { degree: 'M.S. Computer Science', school: 'University of New Haven', year: '2019' },
  { degree: 'B.Tech. Electronics & Telecom', school: 'VIT Pune, India', year: '2013' },
];

const links = [
  { label: 'Portfolio', url: 'https://faisalkhan.dpdns.org' },
  { label: 'GitHub', url: 'https://github.com/faisalkhan91' },
  { label: 'LinkedIn', url: 'https://linkedin.com/in/faisalkhan91' },
  { label: 'Credly', url: 'https://credly.com/users/faisalkhan91' },
];

/** Draw a 0.5pt rule from (x, y) spanning `width`; returns the y below it. */
function rule(doc, x, y, width) {
  doc
    .moveTo(x, y)
    .lineTo(x + width, y)
    .strokeColor(RULE)
    .lineWidth(0.5)
    .stroke();
  return y + 6;
}

/**
 * Accent uppercase section heading + underline rule at an explicit column
 * position. Returns the y below the rule so callers chain content. Used for
 * both the left (Experience) and right (Skills/Certs/Education/Links)
 * columns so the heading treatment lives in one place.
 */
function columnHeading(doc, x, y, width, title) {
  doc
    .fontSize(10)
    .fillColor(ACCENT)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), x, y, { characterSpacing: 1.5, width });
  return rule(doc, x, doc.y + 3, width);
}

/** Render a plain-string list (skills, certs) in the right column. */
function textList(doc, x, startY, width, items, size) {
  let y = startY;
  for (const item of items) {
    doc.fontSize(size).fillColor(TEXT).font('Helvetica').text(item, x, y, { width });
    y = doc.y + 1;
  }
  return y;
}

/** Index of the current (last) buffered page. Requires bufferPages: true. */
function currentPageIndex(doc) {
  const range = doc.bufferedPageRange();
  return range.start + range.count - 1;
}

function generate() {
  // bufferPages lets us draw the left column (which may spill onto a second
  // page) and then jump BACK to the page where the two-column block began to
  // anchor the right column — without it, an overflowing left column resets
  // doc.y onto a new page and the right column paints over the experience.
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 40, bottom: 36, left: MARGIN, right: MARGIN },
    bufferPages: true,
    info: {
      Title: 'Faisal Khan - Resume',
      Author: 'Faisal Khan',
      Subject: 'Senior Software Engineer',
    },
  });

  const stream = createWriteStream(OUTPUT);
  doc.pipe(stream);

  // --- Header ---
  doc
    .fontSize(24)
    .fillColor(TEXT)
    .font('Helvetica-Bold')
    .text('Faisal Khan', MARGIN, 40, { align: 'left' });

  doc
    .fontSize(11)
    .fillColor(MUTED)
    .font('Helvetica')
    .text('Senior Software Engineer', MARGIN, doc.y, { align: 'left' });

  doc.moveDown(0.4);
  doc
    .fontSize(8)
    .fillColor(MUTED)
    .font('Helvetica')
    .text(
      'faisalkhan91@gmail.com  |  +1 (475)-355-7575  |  Kirkland, WA  |  linkedin.com/in/faisalkhan91  |  github.com/faisalkhan91',
      MARGIN,
      doc.y,
      { align: 'left' },
    );

  doc.moveDown(0.6);
  rule(doc, MARGIN, doc.y, CONTENT_WIDTH);
  doc.moveDown(0.1);

  // --- Summary ---
  doc
    .fontSize(9)
    .fillColor(TEXT)
    .font('Helvetica')
    .text(
      `Senior Software Engineer with ${yearsOfExperience()}+ years of experience architecting systems across fintech, healthcare, and telecom. Currently focused on cloud efficiency, AI-augmented platform engineering, and observability at scale. Core stack: Python, Go, TypeScript, AWS, Azure, Kubernetes, Docker, and Terraform.`,
      MARGIN,
      doc.y,
      { width: CONTENT_WIDTH, lineGap: 2 },
    );

  doc.moveDown(0.6);

  // --- Two-column layout ---
  const twoColStartY = doc.y;
  const startPageIdx = currentPageIndex(doc);

  // === LEFT COLUMN: Experience (drawn first; may paginate) ===
  doc.y = columnHeading(doc, MARGIN, twoColStartY, LEFT_COL, 'Experience');

  for (const job of experience) {
    doc
      .fontSize(9)
      .fillColor(TEXT)
      .font('Helvetica-Bold')
      .text(job.role, MARGIN, doc.y, { width: LEFT_COL });

    doc
      .fontSize(8)
      .fillColor(ACCENT)
      .font('Helvetica')
      .text(`${job.company}  |  ${job.dates}`, MARGIN, doc.y, { width: LEFT_COL });

    doc.fontSize(8).fillColor(MUTED).font('Helvetica').text(job.summary, MARGIN, doc.y, {
      width: LEFT_COL,
      lineGap: 1,
    });

    doc.moveDown(0.5);
  }

  const leftColEndY = doc.y;
  const leftEndPageIdx = currentPageIndex(doc);

  // === RIGHT COLUMN: anchored back to the two-column start page ===
  const rightX = MARGIN + LEFT_COL + COL_GAP;
  doc.switchToPage(startPageIdx);
  let rightY = twoColStartY;

  // Skills
  rightY = columnHeading(doc, rightX, rightY, RIGHT_COL, 'Skills');
  rightY = textList(doc, rightX, rightY, RIGHT_COL, skills, 8) + 8;

  // Certifications
  rightY = columnHeading(doc, rightX, rightY, RIGHT_COL, 'Certifications');
  rightY = textList(doc, rightX, rightY, RIGHT_COL, certifications, 7.5) + 8;

  // Education
  rightY = columnHeading(doc, rightX, rightY, RIGHT_COL, 'Education');
  for (const edu of education) {
    doc
      .fontSize(8)
      .fillColor(TEXT)
      .font('Helvetica-Bold')
      .text(edu.degree, rightX, rightY, { width: RIGHT_COL });
    doc
      .fontSize(7.5)
      .fillColor(MUTED)
      .font('Helvetica')
      .text(`${edu.school}, ${edu.year}`, rightX, doc.y, { width: RIGHT_COL });
    rightY = doc.y + 6;
  }
  rightY += 4;

  // Links
  rightY = columnHeading(doc, rightX, rightY, RIGHT_COL, 'Links');
  for (const link of links) {
    doc.fontSize(7.5).fillColor(LINK).font('Helvetica').text(link.label, rightX, rightY, {
      width: RIGHT_COL,
      link: link.url,
      underline: true,
    });
    rightY = doc.y + 1;
  }
  const rightColEndY = rightY;

  // Leave the cursor at the true bottom of the two-column block so the page
  // count is correct and any future trailing content flows from the right
  // place — whichever column ended lower (or on a later page) wins.
  doc.switchToPage(leftEndPageIdx);
  doc.y = leftEndPageIdx === startPageIdx ? Math.max(leftColEndY, rightColEndY) : leftColEndY;

  doc.end();

  return new Promise((resolvePromise, reject) => {
    stream.on('finish', () => resolvePromise(OUTPUT));
    stream.on('error', reject);
  });
}

generate()
  .then((output) => console.log(`Resume generated: ${output}`))
  .catch((err) => {
    console.error('Resume generation failed:', err);
    process.exitCode = 1;
  });
