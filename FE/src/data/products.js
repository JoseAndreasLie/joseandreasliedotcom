// Live products. Shape is a contract (Home imports `products` for featured products):
// {
//   slug, name, tagline, url: string|null, status: 'Live'|'Private', badge: string|null,
//   stack: string[], role: string|null, summary, year: number|null,
//   writeup: string[] (paragraphs),
//   screenshots: { desktop: string|null (16:10), mobile: string|null (9:19.5) },
//   caseStudy: null | { problem, architecture: string|null, stack: string[]|null, role: string|null },
// }
// Splitter and Badminton facts come from the live apps. Echo is confidential: url stays null,
// no client name, no real data, mock data screenshots only.

export const products = [
  {
    slug: 'splitter',
    name: 'Splitter',
    tagline: 'Expense splitter for groups',
    url: 'https://splitter.jose.web.id',
    status: 'Live',
    badge: null,
    stack: ['React', 'Vite', 'Browser storage'],
    role: 'Designer and developer',
    summary: 'I built it for myself: log what everyone paid on a trip or dinner, then see who pays back whom.',
    year: null,
    writeup: [
      'I built Splitter because I use it. When many people share the costs of a trip or a dinner, paying everyone back turns into a pile of receipts and a long chat about who owes whom. Splitter makes that simple: add who is in, log what everyone paid, and the balances keep themselves.',
      'Each expense splits equally, across the people you pick, or by a set amount per person. Every event has its own currency, and it locks once the first expense is in so the numbers never drift.',
      'Settle up lists who pays whom, and each transfer can be marked as paid. It runs in the browser with no account, and events export and import as JSON.',
    ],
    // User assets go here, e.g. '/products/splitter-desktop.webp' (16:10) and '/products/splitter-mobile.webp' (9:19.5) in FE/public.
    screenshots: { desktop: null, mobile: null },
    caseStudy: null,
  },
  {
    slug: 'badminton',
    name: 'Badminton',
    tagline: 'Badminton matchmaking',
    url: 'https://badminton.jose.web.id',
    status: 'Live',
    badge: null,
    stack: ['React', 'Vite', 'Browser storage'],
    role: 'Designer and developer',
    summary: 'Built for my own sessions: paste the WhatsApp attendance list and get balanced doubles with a schedule ready to share.',
    year: null,
    writeup: [
      'Badminton is my hobby, and running a session well is harder than playing in one. Every match should be balanced, fun and well organised for everyone who turns up, so I built a tool that does that work for me.',
      'Weekly sessions start in a group chat: a numbered list of who is coming. Badminton reads that list as pasted and fills in the session date, time and place from it. You set each player\'s level and, when needed, when they arrive or leave.',
      'It builds balanced doubles and shares games in proportion to time on court, so late arrivals and early leavers still get a fair share. During play, a free court takes whoever has waited longest, and a tap swaps in the bench player closest in level.',
      'The schedule exports as a PNG for the chat or as a link that opens the whole match. Everything runs in the browser. No account, no server.',
    ],
    // User assets go here, e.g. '/products/badminton-desktop.webp' (16:10) and '/products/badminton-mobile.webp' (9:19.5) in FE/public.
    screenshots: { desktop: null, mobile: null },
    caseStudy: null,
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
    year: null,
    writeup: [],
    // Mock data screenshots only, never real data. Same slots: desktop 16:10, mobile 9:19.5.
    screenshots: { desktop: null, mobile: null },
    caseStudy: {
      problem:
        'A business that moves money every day needs one record it can trust. Echo is that record: a ledger built for money related business operations, now in production and handling real data for a client.',
      // Jose to fill: architecture. Keep it free of client names, URLs and real figures.
      architecture: null,
      stack: ['React', 'Node.js', 'Express'],
      role: 'Owner and fullstack developer',
    },
  },
]

export const getProduct = (slug) => products.find((p) => p.slug === slug)
