// Projects from JoseAndreasLie'sPortfolio.pdf (pages 6 to 8). Facts only, nothing added.
// year: the PDF gives none. Apple Developer Academy projects use 2025 from the CV (Academy Mar to Dec 2025); ComePet uses 2024 (Sep to Dec 2024, portfolio.js); others stay null.
// links: none in the PDF. Add { label, url } when they exist.

export const projects = [
  {
    slug: 'antarbul',
    title: 'AntarBul',
    year: 2025,
    company: 'Hex & Code · Apple Developer Academy',
    role: 'Lead Backend Engineer',
    summary: 'A fast, effective pet taxi platform connecting owners with reliable drivers.',
    notes: [
      {
        label: 'Key insight',
        text: 'Acted as the sole backend engineer, negotiating system requirements with the frontend team to build a scalable foundation from scratch.',
      },
    ],
    tags: ['Node.js', 'PostgreSQL', 'GitHub', 'AWS EC2', 'Docker'],
    links: [],
  },
  {
    slug: 'nine-to-six',
    title: 'Nine to Six',
    year: null,
    company: 'Aftersix',
    role: 'Backend Engineer Intern',
    summary: 'A comprehensive HR Information System (HRIS) to streamline employee management.',
    notes: [
      {
        label: 'Status',
        text: 'In user testing, focused on optimizing backend performance based on real world data.',
      },
    ],
    tags: ['Node.js', 'PostgreSQL', 'GitHub'],
    links: [],
  },
  {
    slug: 'buahhati',
    title: 'BuahHati',
    year: 2025,
    company: 'Buah Hati Team · Apple Developer Academy',
    role: 'iOS Engineer',
    summary: 'An AI powered app that helps users identify avocado ripeness instantly.',
    notes: [
      { label: 'Outcome', text: 'Published on the App Store.' },
      { label: 'Lesson', text: 'Gained deep respect for the iterative nature of training accurate machine learning models.' },
    ],
    tags: ['SwiftUI', 'Core ML', 'SwiftData'],
    links: [],
  },
  {
    slug: 'comepet',
    title: 'ComePet',
    year: 2024,
    company: 'Personal Project',
    role: 'Mobile Application Developer',
    summary: 'A social media application for pet owners, with sharing, social networking, and instant messaging.',
    notes: [
      {
        label: 'Outcome',
        text: 'Delivered a user friendly interface and smooth app performance to enhance the pet owner experience.',
      },
    ],
    tags: ['Kotlin', 'Android Studio'],
    links: [],
  },
]
