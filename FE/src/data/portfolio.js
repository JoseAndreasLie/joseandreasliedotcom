export const profile = {
  name: 'Jose Andreas Lie',
  // Confirmed title line. Render joined with ' · '.
  titles: ['Project Manager', 'Fullstack Developer'],
  tagline: 'Growth, problem solving, open mindedness',
  bio: "I'm a lifetime learner with a T shaped skill set: deep in backend engineering, broad enough to design, build mobile apps and lead a team. I'm an alumnus of the Apple Developer Academy and work as a project manager and fullstack developer, building scalable systems with Node.js and PostgreSQL.",
  extendedBio:
    "I specialize in scalable backend systems and deployment, using my full stack knowledge in Figma, React, and Mobile to bridge the gap between complex logic and great user experience. I'm fueled by problem solving and a constant drive for growth. Beyond the terminal, I'm a cinematographer, always looking for a new perspective or a better way to create.",
  location: 'Tangerang, Indonesia',
  email: 'jose.lie2208@gmail.com',
  phone: '+62 859 2136 8067',
  resume: '/CV_JoseAndreasLie.pdf',
  social: {
    github: 'https://github.com/joseandreaslie',
    linkedin: 'https://www.linkedin.com/in/jose-andreas-lie/',
    instagram: 'https://instagram.com/joseandreaslie',
  },
}

export const skills = [
  { group: 'Frontend', items: ['ReactJS'] },
  { group: 'Backend', items: ['Node.js', 'Express.js', 'PostgreSQL', 'TypeScript'] },
  { group: 'Mobile', items: ['Swift', 'SwiftUI', 'Kotlin'] },
  { group: 'DevOps', items: ['AWS EC2', 'Docker', 'Git', 'GitHub Actions'] },
  { group: 'Design', items: ['Figma'] },
]

export const experience = [
  {
    role: 'Project Manager (Part Time)',
    company: 'PT Visi Karya Nusantara',
    period: 'Jan 2026 to Present',
    points: [
      'Led an Agile team of 3 developers, managing daily standups, sprint planning, and weekly stakeholder updates.',
      'Translated client requests into clear Jira tickets and product backlogs for the development team.',
      'Guided backend architecture by collaborating on database schemas and system design for new features.',
      'Launched integrated features, managing client communication to successfully ship the Overtime and Prorate payroll modules.',
    ],
  },
  {
    role: 'Software Engineer Intern',
    company: 'PT Visi Karya Nusantara',
    period: 'Aug 2025 to Jan 2026',
    points: [
      'Developed backend services using PostgreSQL, Express.js, and Node.js, with frontend work using React.js.',
      'Managed source control and collaboration using Git, ensuring smooth development across teams.',
      'Contributed to building an HRIS product by implementing key payroll features including contract management, payslip generation, overtime calculation, and onboarding setup for new clients.',
    ],
  },
  {
    role: 'iOS Engineer Intern',
    company: 'Apple Developer Academy @BINUS',
    period: 'Mar 2025 to Dec 2025',
    points: [
      'Collaborated with more or less 25 peers across 6 project cycles.',
      'Built functional apps using Swift and SwiftUI.',
    ],
  },
  {
    role: 'Backend Engineer Intern',
    company: 'PT Ganda Visi Jayatama',
    period: 'Jan 2025 to Jul 2025',
    points: [
      'Built and maintained backend systems using PostgreSQL, Express.js, and Node.js for HRIS and payroll solutions.',
      'Implemented Leave Management features, ensuring accurate leave tracking and approval workflows.',
      'Built scalable backend systems for business solutions using structured development workflows.',
    ],
  },
]

export const organizations = [
  {
    role: 'Head of Website Division',
    company: 'Orientasi Mahasiswa Baru UMN 2024',
    period: 'Feb 2024 to Sep 2024',
    points: [
      'Led cross functional collaboration with 11 divisions while managing a team of 8 designers and developers.',
      'Directed end to end website production using Figma for design and React for development.',
      'Coordinated with 30 division leaders to align organizational strategies and operations.',
    ],
  },
]

export const education = [
  {
    school: 'Universitas Multimedia Nusantara',
    location: 'Tangerang, Banten',
    degree: 'Bachelor in Computer Science',
    detail: 'GPA 3.63 / 4.00',
    period: 'Aug 2022 to Aug 2026',
    status: 'Expected',
  },
]
