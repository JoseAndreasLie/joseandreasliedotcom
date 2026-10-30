// Seeds the projects and products that used to live in FE/src/data. Edit them in /admin from here on.
// Skips a slug that already exists, so a rerun or an admin edit is never overwritten.

const projects = [
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
  },
  {
    slug: 'nine-to-six',
    title: 'Nine to Six',
    year: null,
    company: 'Aftersix',
    role: 'Backend Engineer Intern',
    summary: 'A comprehensive HR Information System (HRIS) to streamline employee management.',
    notes: [{ label: 'Status', text: 'In user testing, focused on optimizing backend performance based on real world data.' }],
    tags: ['Node.js', 'PostgreSQL', 'GitHub'],
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
  },
]

const products = [
  {
    slug: 'splitter',
    name: 'Splitter',
    tagline: 'Expense splitter for groups',
    url: 'https://splitter.jose.web.id',
    status: 'Live',
    stack: ['React', 'Vite', 'Browser storage'],
    role: 'Designer and developer',
    summary: 'I built it for myself: log what everyone paid on a trip or dinner, then see who pays back whom.',
    writeup: [
      'I built Splitter because I use it. When many people share the costs of a trip or a dinner, paying everyone back turns into a pile of receipts and a long chat about who owes whom. Splitter makes that simple: add who is in, log what everyone paid, and the balances keep themselves.',
      'Each expense splits equally, across the people you pick, or by a set amount per person. Every event has its own currency, and it locks once the first expense is in so the numbers never drift.',
      'Settle up lists who pays whom, and each transfer can be marked as paid. It runs in the browser with no account, and events export and import as JSON.',
    ],
  },
  {
    slug: 'badminton',
    name: 'Badminton',
    tagline: 'Badminton matchmaking',
    url: 'https://badminton.jose.web.id',
    status: 'Live',
    stack: ['React', 'Vite', 'Browser storage'],
    role: 'Designer and developer',
    summary: 'Built for my own sessions: paste the WhatsApp attendance list and get balanced doubles with a schedule ready to share.',
    writeup: [
      'Badminton is my hobby, and running a session well is harder than playing in one. Every match should be balanced, fun and well organised for everyone who turns up, so I built a tool that does that work for me.',
      "Weekly sessions start in a group chat: a numbered list of who is coming. Badminton reads that list as pasted and fills in the session date, time and place from it. You set each player's level and, when needed, when they arrive or leave.",
      'It builds balanced doubles and shares games in proportion to time on court, so late arrivals and early leavers still get a fair share. During play, a free court takes whoever has waited longest, and a tap swaps in the bench player closest in level.',
      'The schedule exports as a PNG for the chat or as a link that opens the whole match. Everything runs in the browser. No account, no server.',
    ],
  },
  {
    slug: 'echo',
    name: 'Echo',
    tagline: 'Money ledger for business operations',
    url: null, // Confidential. Never add a URL.
    status: 'Private',
    badge: 'Private · in production',
    stack: ['React', 'Node.js', 'Express'],
    role: 'Owner and fullstack developer',
    summary: 'A ledger for money related business operations, running in production for a client.',
    writeup: [],
    case_study: {
      problem:
        'A business that moves money every day needs one record it can trust. Echo is that record: a ledger built for money related business operations, now in production and handling real data for a client.',
      architecture: null,
    },
  },
]

const now = new Date()

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'projects',
      projects.map((p, i) => ({
        ...p,
        notes: JSON.stringify(p.notes),
        published: true,
        featured: i < 3,
        position: i,
        created_at: now,
        updated_at: now,
      })),
      { ignoreDuplicates: true },
    )
    await queryInterface.bulkInsert(
      'products',
      products.map(({ writeup, case_study, ...p }, i) => ({
        badge: null,
        ...p,
        writeup: writeup.join('\n\n'),
        case_study: case_study ? JSON.stringify(case_study) : null,
        published: true,
        featured: true,
        position: i,
        created_at: now,
        updated_at: now,
      })),
      { ignoreDuplicates: true },
    )
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('projects', { slug: projects.map((p) => p.slug) })
    await queryInterface.bulkDelete('products', { slug: products.map((p) => p.slug) })
  },
}
