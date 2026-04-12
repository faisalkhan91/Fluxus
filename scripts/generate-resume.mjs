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

const MARGIN = 48;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COL_GAP = 24;
const LEFT_COL = CONTENT_WIDTH * 0.62;
const RIGHT_COL = CONTENT_WIDTH - LEFT_COL - COL_GAP;

const yearsOfExperience = () => {
  const start = new Date(2013, 5, 1);
  return Math.floor((Date.now() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

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
  'Azure Security & Compliance Fundamentals',
  'Azure Fundamentals',
];

const education = [
  { degree: 'M.S. Computer Science', school: 'University of New Haven', year: '2019' },
  { degree: 'B.Tech. Electronics & Telecom', school: 'VIT Pune, India', year: '2013' },
];

function drawRule(doc, y) {
  doc
    .moveTo(MARGIN, y)
    .lineTo(PAGE_WIDTH - MARGIN, y)
    .strokeColor(RULE)
    .lineWidth(0.5)
    .stroke();
  return y + 8;
}

function sectionHeading(doc, title) {
  doc
    .fontSize(10)
    .fillColor(ACCENT)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), MARGIN, doc.y, {
      characterSpacing: 1.5,
    });
  doc.moveDown(0.3);
  return drawRule(doc, doc.y);
}

function generate() {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 40, bottom: 36, left: MARGIN, right: MARGIN },
    info: {
      Title: 'Faisal Khan - Resume',
      Author: 'Faisal Khan',
      Subject: 'Senior Software Engineer',
    },
  });

  doc.pipe(createWriteStream(OUTPUT));

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
  drawRule(doc, doc.y);
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

  // === LEFT COLUMN: Experience ===
  doc.y = twoColStartY;
  doc
    .fontSize(10)
    .fillColor(ACCENT)
    .font('Helvetica-Bold')
    .text('EXPERIENCE', MARGIN, doc.y, { characterSpacing: 1.5, width: LEFT_COL });
  doc.moveDown(0.3);

  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + LEFT_COL, doc.y)
    .strokeColor(RULE)
    .lineWidth(0.5)
    .stroke();
  doc.y += 6;

  for (const job of experience) {
    const entryStartY = doc.y;

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

  // === RIGHT COLUMN: Skills, Certs, Education ===
  const rightX = MARGIN + LEFT_COL + COL_GAP;
  let rightY = twoColStartY;

  // Skills
  doc
    .fontSize(10)
    .fillColor(ACCENT)
    .font('Helvetica-Bold')
    .text('SKILLS', rightX, rightY, { characterSpacing: 1.5, width: RIGHT_COL });
  rightY = doc.y + 3;

  doc
    .moveTo(rightX, rightY)
    .lineTo(rightX + RIGHT_COL, rightY)
    .strokeColor(RULE)
    .lineWidth(0.5)
    .stroke();
  rightY += 6;

  for (const skill of skills) {
    doc.fontSize(8).fillColor(TEXT).font('Helvetica').text(skill, rightX, rightY, {
      width: RIGHT_COL,
    });
    rightY = doc.y + 1;
  }

  rightY += 8;

  // Certifications
  doc
    .fontSize(10)
    .fillColor(ACCENT)
    .font('Helvetica-Bold')
    .text('CERTIFICATIONS', rightX, rightY, { characterSpacing: 1.5, width: RIGHT_COL });
  rightY = doc.y + 3;

  doc
    .moveTo(rightX, rightY)
    .lineTo(rightX + RIGHT_COL, rightY)
    .strokeColor(RULE)
    .lineWidth(0.5)
    .stroke();
  rightY += 6;

  for (const cert of certifications) {
    doc.fontSize(7.5).fillColor(TEXT).font('Helvetica').text(cert, rightX, rightY, {
      width: RIGHT_COL,
    });
    rightY = doc.y + 1;
  }

  rightY += 8;

  // Education
  doc
    .fontSize(10)
    .fillColor(ACCENT)
    .font('Helvetica-Bold')
    .text('EDUCATION', rightX, rightY, { characterSpacing: 1.5, width: RIGHT_COL });
  rightY = doc.y + 3;

  doc
    .moveTo(rightX, rightY)
    .lineTo(rightX + RIGHT_COL, rightY)
    .strokeColor(RULE)
    .lineWidth(0.5)
    .stroke();
  rightY += 6;

  for (const edu of education) {
    doc.fontSize(8).fillColor(TEXT).font('Helvetica-Bold').text(edu.degree, rightX, rightY, {
      width: RIGHT_COL,
    });
    doc
      .fontSize(7.5)
      .fillColor(MUTED)
      .font('Helvetica')
      .text(`${edu.school}, ${edu.year}`, rightX, doc.y, {
        width: RIGHT_COL,
      });
    rightY = doc.y + 6;
  }

  rightY += 4;

  // Links footer
  doc
    .fontSize(10)
    .fillColor(ACCENT)
    .font('Helvetica-Bold')
    .text('LINKS', rightX, rightY, { characterSpacing: 1.5, width: RIGHT_COL });
  rightY = doc.y + 3;

  doc
    .moveTo(rightX, rightY)
    .lineTo(rightX + RIGHT_COL, rightY)
    .strokeColor(RULE)
    .lineWidth(0.5)
    .stroke();
  rightY += 6;

  const links = [
    { label: 'Portfolio', url: 'https://faisalkhan.serveblog.net' },
    { label: 'GitHub', url: 'https://github.com/faisalkhan91' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/faisalkhan91' },
    { label: 'Credly', url: 'https://credly.com/users/faisalkhan91' },
  ];

  for (const link of links) {
    doc.fontSize(7.5).fillColor('#2563eb').font('Helvetica').text(link.label, rightX, rightY, {
      width: RIGHT_COL,
      link: link.url,
      underline: true,
    });
    rightY = doc.y + 1;
  }

  doc.end();
  console.log(`Resume generated: ${OUTPUT}`);
}

generate();
