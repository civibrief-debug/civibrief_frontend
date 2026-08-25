export const MARKET_INDICES = [
  { symbol: "SENSEX", value: "81,452.30", change: "+0.64%", isPositive: true },
  { symbol: "NIFTY 50", value: "24,820.15", change: "+0.58%", isPositive: true },
  { symbol: "S&P 500", value: "5,468.20", change: "-0.12%", isPositive: false },
  { symbol: "NASDAQ", value: "17,340.50", change: "+0.85%", isPositive: true },
  { symbol: "BRENT CRUDE", value: "$78.40", change: "-1.10%", isPositive: false },
  { symbol: "BITCOIN", value: "$64,250", change: "+2.40%", isPositive: true },
  { symbol: "GOLD", value: "$2,430/oz", change: "+0.15%", isPositive: true }
];

export const BREAKING_NEWS = [
  "GLOBAL MARKETS: Tech stocks rally following record quarterly cloud earnings & AI hardware demand.",
  "ENERGY TRANSITION: European Union approves €40 billion green hydrogen infrastructure mandate.",
  "SPACE EXPLORATION: ISRO and NASA complete integration test for NISAR Earth observation satellite."
];

export const CATEGORIES = [
  { name: "Top Stories", slug: "top-stories" },
  { name: "Tech & AI", slug: "tech" },
  { name: "Global Affairs", slug: "global" },
  { name: "Markets & Economy", slug: "markets" },
  { name: "Science & Climate", slug: "science" },
  { name: "Movies", slug: "movies" },
  { name: "Lifestyle", slug: "lifestyle" },
  { name: "Sports", slug: "sports" },
  { name: "Opinion & Essays", slug: "opinion" },
  { name: "Culture & Design", slug: "culture" },
  { name: "Deep Dives 💎", slug: "deep-dives" }
];

export const CATEGORY_SECTIONS = {
  "tech": {
    name: "Tech & AI",
    sections: [
      { name: "Artificial Intelligence", count: 42 },
      { name: "Chips & Silicon Hardware", count: 28 },
      { name: "Quantum & Edge Compute", count: 19 },
      { name: "Cybersecurity & Defense", count: 31 },
      { name: "Autonomous Systems & Robotics", count: 22 },
      { name: "Biotech & Synthetic Biology", count: 15 }
    ],
    spotlight: {
      tag: "NEWSLETTER",
      title: "The Compute Frontier",
      desc: "Weekly intelligence on semiconductor geopolitics, AI agent architectures, and frontier models.",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
      cta: "SEE ALL NEWSLETTERS"
    }
  },
  "global": {
    name: "Global Affairs",
    sections: [
      { name: "Geopolitics & Strategy", count: 54 },
      { name: "Trade & Supply Chains", count: 36 },
      { name: "Diplomacy & Treaties", count: 27 },
      { name: "Defense & Security", count: 48 },
      { name: "International Law & UN", count: 18 },
      { name: "Sovereign Infrastructure", count: 29 }
    ],
    spotlight: {
      tag: "NEWSLETTER",
      title: "Sovereign Frontiers & Statecraft",
      desc: "Comprehensive coverage of international trade corridors, sanctions, and defense treaties.",
      image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80",
      cta: "SEE ALL NEWSLETTERS"
    }
  },
  "markets": {
    name: "Markets & Economy",
    sections: [
      { name: "Global Stock Indices", count: 65 },
      { name: "Central Banks & Interest Rates", count: 38 },
      { name: "Venture Capital & Private Equity", count: 44 },
      { name: "Energy & Commodities", count: 32 },
      { name: "Macroeconomics & Inflation", count: 51 },
      { name: "Real Estate & Infrastructure", count: 24 }
    ],
    spotlight: {
      tag: "NEWSLETTER",
      title: "Capital Markets Weekly",
      desc: "Real-time analysis of central bank decisions, yield curves, and tech valuation trends.",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80",
      cta: "SEE ALL NEWSLETTERS"
    }
  },
  "science": {
    name: "Science & Climate",
    sections: [
      { name: "Clean Energy & Nuclear Fusion", count: 33 },
      { name: "Space Exploration & NISAR", count: 26 },
      { name: "Genomics & Precision Medicine", count: 29 },
      { name: "Climate Policy & Decarbonization", count: 41 },
      { name: "Quantum Physics & Materials", count: 17 },
      { name: "Deep Ocean & Polar Research", count: 14 }
    ],
    spotlight: {
      tag: "NEWSLETTER",
      title: "The Fusion & Climate Horizon",
      desc: "Deep dives into next-generation energy transitions, zero-carbon grids, and orbital science.",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80",
      cta: "SEE ALL NEWSLETTERS"
    }
  },
  "opinion": {
    name: "Opinion & Essays",
    sections: [
      { name: "Lead Editorials", count: 50 },
      { name: "Guest Columns & Thinkers", count: 38 },
      { name: "Ethics of AI & Automation", count: 27 },
      { name: "Economic Policy Debates", count: 34 },
      { name: "Future of Work & Society", count: 42 },
      { name: "Book Reviews & Critical Essays", count: 19 }
    ],
    spotlight: {
      tag: "NEWSLETTER",
      title: "The Architecture of Human Agency",
      desc: "Reflections on technological governance, algorithmic authority, and democratic institutions.",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80",
      cta: "SEE ALL NEWSLETTERS"
    }
  },
  "culture": {
    name: "Culture & Design",
    sections: [
      { name: "Biophilic & Urban Architecture", count: 21 },
      { name: "Digital Art & Generative Media", count: 33 },
      { name: "Industrial Design Systems", count: 18 },
      { name: "Media, Film & Cinema Reviews", count: 45 },
      { name: "Modern Philosophy & Literature", count: 27 },
      { name: "Visual Culture & Exhibitions", count: 22 }
    ],
    spotlight: {
      tag: "NEWSLETTER",
      title: "First Day First Show",
      desc: "Reviews, curator notes, and longform profiles on contemporary artists and filmmakers.",
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
      cta: "SEE ALL NEWSLETTERS"
    }
  },
  "movies": {
    name: "Movies",
    sections: [
      { name: "Box Office & Blockbusters", count: 28 },
      { name: "Film Festivals & Oscars", count: 19 },
      { name: "Streaming & OTT Releases", count: 35 },
      { name: "Director Cut & Screenwriting", count: 14 }
    ],
    spotlight: {
      tag: "FEATURE",
      title: "The Cinema Horizon",
      desc: "Inside Hollywood & global cinema production trends and premiere reviews.",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80",
      cta: "EXPLORE MOVIES"
    }
  },
  "lifestyle": {
    name: "Lifestyle",
    sections: [
      { name: "Wellness & Longevity", count: 32 },
      { name: "Architecture & Interiors", count: 24 },
      { name: "Travel & Culinary Arts", count: 41 },
      { name: "High Fashion & Horology", count: 18 }
    ],
    spotlight: {
      tag: "FEATURE",
      title: "Modern Living & Culture",
      desc: "Curated guides on modern architecture, wellness science, and luxury travel.",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80",
      cta: "EXPLORE LIFESTYLE"
    }
  },
  "sports": {
    name: "Sports",
    sections: [
      { name: "Basketball", count: 38 },
      { name: "Olympics", count: 44 },
      { name: "Asian Games", count: 26 },
      { name: "Wrestling", count: 18 },
      { name: "FIFA World Cup", count: 62 },
      { name: "Cricket & World Cups", count: 45 },
      { name: "Football & European Leagues", count: 52 },
      { name: "Formula 1 & Motorsport", count: 29 },
      { name: "Tennis Grand Slams", count: 21 }
    ],
    spotlight: {
      tag: "FEATURE",
      title: "Global Sports Arena",
      desc: "Comprehensive analytics, live tournament stats, and championship playbooks.",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80",
      cta: "EXPLORE SPORTS"
    }
  },
  "deep-dives": {
    name: "Deep Dives 💎",
    sections: [
      { name: "Special Investigative Series", count: 15 },
      { name: "Interactive Data Charts & Maps", count: 28 },
      { name: "Executive Policy Playbooks", count: 12 },
      { name: "5-Year Tech Forecasts", count: 10 },
      { name: "Sovereign AI Benchmarks 2026", count: 8 }
    ],
    spotlight: {
      tag: "NEWSLETTER",
      title: "Sovereign AI Benchmarks Report 2026",
      desc: "Our landmark 50-page breakdown analyzing $120B in global compute investments.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",
      cta: "SEE ALL NEWSLETTERS"
    }
  }
};

export const HERO_FEATURED = {
  id: "quantum-leap-ai-2026",
  slug: "quantum-leap-ai-2026",
  category: "TECH & AI",
  title: "The Architecture of Tomorrow: Next-Gen Compute Models Shift Global Tech Power",
  subtitle: "As chip manufacturing advances beyond 2-nanometer thresholds, silicon independence has become the ultimate geopolitical chess move.",
  author: "Dr. Elena Rostova",
  authorTitle: "Senior Tech & Policy Editor",
  authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  date: "August 3, 2026",
  readTime: "6 min read",
  hasAudio: true,
  imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80",
  imageCaption: "Advanced semiconductor fabrication node undergoing optical alignment in Dresden.",
  takeaways: [
    "Next-generation 2nm node production transitions from experimental pilot lines to commercial high-volume yields.",
    "Global compute demand is projected to double every 9 months through 2028 driven by autonomous agents.",
    "Sovereign AI infrastructure investments surpassed $120 billion across Europe, East Asia, and the Americas."
  ],
  content: `DRESDEN — Across cleanrooms in Silicon Saxony and Hsinchu, semiconductor physics is reaching its theoretical boundaries. Silicon wafers measuring 300 millimeters in diameter are now routinely etched with features smaller than a single strand of human DNA.

What began as a corporate arms race among chip designers has evolved into the central pillar of national economic strategy. Over the past 24 months, sovereign wealth funds and governments have funneled unprecedented capital into domestic fabrication plants, seeking immunity from supply chain chokepoints.

"We are no longer simply scaling transistors," explains Dr. Marcus Vance, Chief Architect at Semiconductor Dynamics. "We are architecting multi-die chiplet ecosystems linked by optical interconnects. Compute power is transitioning from a commodity into a strategic national utility."

The implications ripple across energy grids, data centers, and corporate boardrooms worldwide. Cloud infrastructure giants are consuming an estimated 4% of global electrical output, spurring dedicated investments in small modular nuclear reactors and geothermal power stations.

As autonomous AI agents assume complex tasks in financial modeling, drug discovery, and robotics, the demand for ultra-low-latency processing has triggered a fundamental redesign of internet edge networks.`
};

export const HERO_SECONDARY = [
  {
    id: "global-grid-energy",
    slug: "global-grid-energy",
    category: "SCIENCE & CLIMATE",
    title: "High-Voltage Supergrids: Transcontinental Solar Highways Take Shape",
    excerpt: "Subsea direct-current cables linking North Africa to Southern Europe promise 24/7 clean power generation.",
    author: "Julian Thorne",
    date: "August 3, 2026",
    readTime: "4 min read",
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "autonomous-logistics-fleets",
    slug: "autonomous-logistics-fleets",
    category: "BUSINESS",
    title: "Freight Revolution: Electric Cargo Ships Complete First Unmanned Transpacific Voyage",
    excerpt: "Autonomous navigation systems reduce ocean freight emissions by 34% while establishing zero-emission trade corridors.",
    author: "Samantha Chen",
    date: "August 3, 2026",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "monetary-policy-shift",
    slug: "monetary-policy-shift",
    category: "MARKETS & ECONOMY",
    title: "Central Banks Weigh Programmability As Digital Currencies Cross $1 Trillion Mark",
    excerpt: "Tokenized real-world assets and instant cross-border settlement channels challenge traditional correspondent banking.",
    author: "Marcus Sterling",
    date: "August 3, 2026",
    readTime: "4 min read",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80"
  }
];

export const MAIN_ARTICLES = [
  {
    id: "urban-architecture-biophilic",
    slug: "urban-architecture-biophilic",
    category: "CULTURE & DESIGN",
    title: "Biophilic Metropolis: How Timber Skyscraper Towers Are Cooling Urban Heat Islands",
    excerpt: "Engineered mass timber construction reduces embodied carbon by 60% while creating living forest facades in Singapore and Stockholm.",
    author: "Amara Nwosu",
    date: "August 3, 2026",
    readTime: "6 min read",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    content: `SINGAPORE — Rising 30 stories above the city state's financial district, the new Asia Green Tower does not resemble a traditional glass and steel monolith. Its exterior cascades with thousands of native flora species, nurtured by automated graywater drip systems.

Mass timber structures engineered from cross-laminated timber (CLT) are rapidly transforming municipal building codes across Scandinavia, Japan, and Southeast Asia.`
  },
  {
    id: "fusion-power-pilot-plant",
    slug: "fusion-power-pilot-plant",
    category: "SCIENCE & CLIMATE",
    title: "Tokamak Milestone: High-Temperature Superconducting Magnets Achieve Sustained Plasma Containment",
    excerpt: "Private fusion startups record 120-second plasma stability, bringing commercial net-energy gain within 5-year reach.",
    author: "Dr. Aris Thorne",
    date: "August 3, 2026",
    readTime: "7 min read",
    imageUrl: "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80",
    content: `OXFORDSHIRE — Inside the magnetic confinement chamber at Tokamak Energy, temperatures reached 100 million degrees Celsius — five times hotter than the core of the sun.`
  },
  {
    id: "ai-personalized-medicine",
    slug: "ai-personalized-medicine",
    category: "TECH & AI",
    title: "RNA Synthetic Therapeutics: Gene Therapy Moves From Months to Minutes with Generative Design",
    excerpt: "Customized mRNA treatments designed for individual patient oncological mutations begin clinical trials in Zurich.",
    author: "Claire Vance",
    date: "August 3, 2026",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
    content: `ZURICH — By pairing deep learning protein structure models with rapid automated synthesisers, clinicians can now sequence a tumor biopsy on Monday and manufacture a targeted vaccine by Friday.`
  },
  {
    id: "space-economy-asteroid-mining",
    slug: "space-economy-asteroid-mining",
    category: "GLOBAL AFFAIRS",
    title: "Orbital Manufacturing Hubs: Lunar Gateway Expands Commercial Industrial Slots",
    excerpt: "Zero-gravity fiber optic production and organoid crystallization attract $15B in venture backing for orbital stations.",
    author: "Vikram Malhotra",
    date: "August 3, 2026",
    readTime: "4 min read",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    content: `LOW EARTH ORBIT — In the microgravity environment 400 kilometers above Earth, materials behave fundamentally differently. Flawless ZBLAN optical fibers spun without gravity-induced defects conduct light 100 times more efficiently.`
  }
];

export const MOST_READ = [
  {
    rank: 1,
    id: "quantum-leap-ai-2026",
    title: "The Architecture of Tomorrow: Next-Gen Compute Models Shift Global Tech Power",
    category: "TECH & AI",
    readTime: "6 min read"
  },
  {
    rank: 2,
    id: "fusion-power-pilot-plant",
    title: "Tokamak Milestone: High-Temperature Superconducting Magnets Achieve Sustained Plasma",
    category: "SCIENCE",
    readTime: "7 min read"
  },
  {
    rank: 3,
    id: "monetary-policy-shift",
    title: "Central Banks Weigh Programmability As Digital Currencies Cross $1 Trillion",
    category: "MARKETS",
    readTime: "4 min read"
  },
  {
    rank: 4,
    id: "ai-personalized-medicine",
    title: "RNA Synthetic Therapeutics: Gene Therapy Moves From Months to Minutes",
    category: "HEALTH",
    readTime: "5 min read"
  },
  {
    rank: 5,
    id: "urban-architecture-biophilic",
    title: "Biophilic Metropolis: How Timber Skyscraper Towers Are Cooling Urban Heat Islands",
    category: "DESIGN",
    readTime: "6 min read"
  }
];

export const DEEP_DIVES = [
  {
    id: "deep-dive-deepsea-minerals",
    category: "INVESTIGATION",
    title: "The Battle for the Clarion-Clipperton Zone",
    subtitle: "Four kilometers beneath the Pacific Ocean lies enough cobalt and nickel to power billions of EVs. Environmental scientists and mining syndicates are locked in a high-stakes standoff.",
    author: "Helena Zhao & Peter Krauss",
    readTime: "14 min read",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
    isDeepDive: true,
    content: `Four thousand meters below the Pacific surface, between Hawaii and Mexico, rests the Clarion-Clipperton Zone—a 4.5 million square kilometer abyssal plain strewn with billions of polymetallic nodules. These potato-sized mineral aggregates contain more nickel, cobalt, copper, and manganese than all known terrestrial reserves combined.

As the global transition to electric mobility and renewable energy accelerates, deep-sea mining syndicates backed by sovereign investment funds are preparing industrial robotic crawlers to harvest the seabed floor.

However, marine biologists warn that these abyssal ecosystems, untouched for millions of years, harbor unique benthic life forms that may never recover from heavy sedimentation plumes and habitat destruction. International regulatory bodies in Kingston, Jamaica, are currently negotiating binding environmental exploitation codes that will define oceanic governance for the next century.`
  },
  {
    id: "deep-dive-water-scarcity-tech",
    category: "SPECIAL REPORT",
    title: "Desalination's Graphene Frontier",
    subtitle: "Atomic-scale membranes could solve freshwater security for 2 billion people using 80% less energy than reverse osmosis.",
    author: "Tariq Al-Mansoor",
    readTime: "11 min read",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    isDeepDive: true,
    content: `Freshwater scarcity is emerging as the critical geopolitical bottleneck of the 21st century. While traditional reverse osmosis desalination facilities supply millions of cubic meters of potable water across arid coastlines, their extreme energy intensity and brine discharge create severe ecological and economic costs.

A revolutionary breakthrough in single-layer nanoporous graphene membranes is overturning these constraints. By drilling sub-nanometer pores that allow water molecules to pass while rejecting sodium and chloride ions at atomic precision, new membranes achieve five times the hydraulic throughput of polyamide filters.

Pilot installations in Ras Al-Khair and Southern California are demonstrating an 80% reduction in thermal and electrical energy consumption, promising to make municipal seawater desalination economically viable for landlocked agricultural hubs and developing coastal megacities.`
  }
];
