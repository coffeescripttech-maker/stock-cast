// Preparedness Guides Data
// Static content for disaster preparedness

export interface Guide {
  id: number;
  category: 'typhoon' | 'earthquake' | 'flood' | 'fire' | 'general';
  title: string;
  icon: string;
  description: string;
  content: GuideSection[];
  lastUpdated: string;
}

export interface GuideSection {
  heading: string;
  items: string[];
}

export const preparednessGuides: Guide[] = [
  {
    id: 1,
    category: 'typhoon',
    title: 'Typhoon Preparedness',
    icon: '🌀',
    description: 'Essential guide for preparing and staying safe during typhoons',
    lastUpdated: '2026-01-01',
    content: [
      {
        heading: 'Before a Typhoon',
        items: [
          'Monitor weather updates from PAGASA regularly',
          'Prepare emergency kit with food, water, medicines, and flashlight',
          'Secure loose outdoor items that could become projectiles',
          'Know your evacuation route and nearest evacuation center',
          'Charge all electronic devices and power banks',
          'Store important documents in waterproof containers',
          'Stock up on non-perishable food for at least 3 days',
          'Fill bathtubs and containers with clean water',
        ],
      },
      {
        heading: 'During a Typhoon',
        items: [
          'Stay indoors and away from windows',
          'Listen to battery-powered radio for updates',
          'Evacuate immediately if ordered by authorities',
          'Avoid using electrical appliances during heavy rain',
          'Do not go outside during the eye of the storm',
          'Keep emergency kit and important documents ready',
          'Stay in the strongest part of your house',
          'Avoid flooded areas and downed power lines',
        ],
      },
      {
        heading: 'After a Typhoon',
        items: [
          'Wait for official all-clear before going outside',
          'Check for injuries and provide first aid if needed',
          'Inspect your home for damage before entering',
          'Avoid floodwater - it may be contaminated',
          'Report downed power lines to authorities',
          'Document damage with photos for insurance',
          'Boil water before drinking if supply is compromised',
          'Help neighbors, especially elderly and disabled',
        ],
      },
      {
        heading: 'Emergency Kit Essentials',
        items: [
          'Water (1 gallon per person per day for 3 days)',
          'Non-perishable food (canned goods, instant noodles)',
          'First aid kit and essential medicines',
          'Flashlight and extra batteries',
          'Battery-powered or hand-crank radio',
          'Whistle to signal for help',
          'Dust masks and plastic sheeting',
          'Cash and important documents',
        ],
      },
    ],
  },
  {
    id: 2,
    category: 'earthquake',
    title: 'Earthquake Preparedness',
    icon: '🌍',
    description: 'How to prepare for and respond to earthquakes',
    lastUpdated: '2026-01-01',
    content: [
      {
        heading: 'Before an Earthquake',
        items: [
          'Secure heavy furniture and appliances to walls',
          'Identify safe spots in each room (under sturdy tables)',
          'Practice "Drop, Cover, and Hold On" with family',
          'Keep emergency supplies in accessible locations',
          'Know how to turn off gas, water, and electricity',
          'Prepare an emergency communication plan',
          'Store breakables on lower shelves',
          'Keep shoes and flashlight near your bed',
        ],
      },
      {
        heading: 'During an Earthquake',
        items: [
          'DROP to your hands and knees immediately',
          'COVER your head and neck under sturdy furniture',
          'HOLD ON until shaking stops',
          'If indoors, stay inside - do not run outside',
          'If outdoors, move away from buildings and power lines',
          'If in a vehicle, pull over and stay inside',
          'Stay away from windows, mirrors, and heavy objects',
          'Do not use elevators',
        ],
      },
      {
        heading: 'After an Earthquake',
        items: [
          'Check yourself and others for injuries',
          'Expect aftershocks - be ready to Drop, Cover, Hold On',
          'Inspect your home for damage',
          'Turn off gas if you smell or hear a leak',
          'Use stairs, not elevators',
          'Stay away from damaged buildings',
          'Listen to radio for emergency information',
          'Help neighbors who may need assistance',
        ],
      },
      {
        heading: 'Safety Tips',
        items: [
          'Most injuries occur from falling objects',
          'Doorways are not safer than other locations',
          'Triangle of Life theory is NOT recommended',
          'Stay where you are until shaking stops',
          'Be prepared for aftershocks',
          'Tsunami may follow coastal earthquakes',
          'Do not light matches if gas leak suspected',
          'Text instead of call to reduce network congestion',
        ],
      },
    ],
  },
  {
    id: 3,
    category: 'flood',
    title: 'Flood Safety Guide',
    icon: '🌊',
    description: 'Staying safe before, during, and after floods',
    lastUpdated: '2026-01-01',
    content: [
      {
        heading: 'Before a Flood',
        items: [
          'Know your area\'s flood risk and evacuation routes',
          'Sign up for emergency alerts and warnings',
          'Prepare emergency kit with waterproof containers',
          'Move valuable items to higher floors',
          'Install check valves in plumbing',
          'Keep important documents in waterproof bags',
          'Have a family communication plan',
          'Know where to go if evacuation is ordered',
        ],
      },
      {
        heading: 'During a Flood',
        items: [
          'Evacuate immediately if told to do so',
          'Move to higher ground if flooding occurs',
          'NEVER walk, swim, or drive through floodwater',
          'Just 6 inches of moving water can knock you down',
          '2 feet of water can carry away most vehicles',
          'Stay away from bridges over fast-moving water',
          'If trapped, go to highest level - not attic',
          'Signal for help if trapped',
        ],
      },
      {
        heading: 'After a Flood',
        items: [
          'Return home only when authorities say it\'s safe',
          'Avoid floodwater - it may be contaminated',
          'Document damage with photos',
          'Clean and disinfect everything that got wet',
          'Throw away food that touched floodwater',
          'Boil water until supply is declared safe',
          'Watch for animals, especially snakes',
          'Be aware of electrical hazards',
        ],
      },
      {
        heading: 'Important Reminders',
        items: [
          'Turn Around, Don\'t Drown - avoid flooded roads',
          'Floodwater can contain sewage and chemicals',
          'Standing water can hide dangers',
          'Mold can grow quickly after flooding',
          'Carbon monoxide poisoning from generators',
          'Keep children away from floodwater',
          'Wear protective clothing when cleaning',
          'Seek medical attention for any injuries',
        ],
      },
    ],
  },
  {
    id: 4,
    category: 'fire',
    title: 'Fire Safety & Prevention',
    icon: '🔥',
    description: 'Fire prevention and emergency response guide',
    lastUpdated: '2026-01-01',
    content: [
      {
        heading: 'Fire Prevention',
        items: [
          'Install smoke alarms on every level of your home',
          'Test smoke alarms monthly',
          'Keep fire extinguisher in kitchen and garage',
          'Never leave cooking unattended',
          'Keep flammable items away from heat sources',
          'Don\'t overload electrical outlets',
          'Store matches and lighters out of children\'s reach',
          'Have chimneys and heating systems inspected annually',
        ],
      },
      {
        heading: 'If Fire Occurs',
        items: [
          'GET OUT immediately - don\'t try to save belongings',
          'Crawl low under smoke',
          'Feel doors before opening - if hot, use another exit',
          'Close doors behind you as you escape',
          'Once out, stay out - never go back inside',
          'Call 911 from outside',
          'Meet at designated meeting place',
          'If clothes catch fire: Stop, Drop, and Roll',
        ],
      },
      {
        heading: 'Escape Planning',
        items: [
          'Plan two ways out of every room',
          'Practice your escape plan twice a year',
          'Choose a meeting place outside',
          'Teach children how to escape on their own',
          'Know how to call for help',
          'Consider escape ladders for upper floors',
          'Make sure windows and doors open easily',
          'Mark children\'s rooms for firefighters',
        ],
      },
      {
        heading: 'Using a Fire Extinguisher',
        items: [
          'Remember PASS: Pull, Aim, Squeeze, Sweep',
          'PULL the pin',
          'AIM at the base of the fire',
          'SQUEEZE the handle',
          'SWEEP from side to side',
          'Only fight small fires',
          'Always have an escape route behind you',
          'If fire doesn\'t go out, evacuate immediately',
        ],
      },
    ],
  },
  {
    id: 5,
    category: 'general',
    title: 'General Emergency Preparedness',
    icon: '🛡️',
    description: 'Essential preparedness tips for all disasters',
    lastUpdated: '2026-01-01',
    content: [
      {
        heading: 'Emergency Kit Basics',
        items: [
          'Water: 1 gallon per person per day (3-day supply)',
          'Food: Non-perishable items (3-day supply)',
          'Battery-powered or hand-crank radio',
          'Flashlight and extra batteries',
          'First aid kit',
          'Whistle to signal for help',
          'Dust mask or face covering',
          'Moist towelettes and garbage bags',
        ],
      },
      {
        heading: 'Important Documents',
        items: [
          'Copies of insurance policies',
          'Identification documents',
          'Bank account records',
          'Medical records and prescriptions',
          'Proof of address',
          'Birth certificates',
          'Property deeds',
          'Store in waterproof container',
        ],
      },
      {
        heading: 'Communication Plan',
        items: [
          'Designate an out-of-area contact person',
          'Ensure all family members know contact numbers',
          'Text messages may work when calls don\'t',
          'Keep phone charged and have backup power',
          'Know your children\'s school emergency plans',
          'Have a meeting place if separated',
          'Register with local emergency alert system',
          'Keep list of emergency contacts',
        ],
      },
      {
        heading: 'Special Considerations',
        items: [
          'Plan for pets - they can\'t evacuate alone',
          'Extra supplies for infants (formula, diapers)',
          'Medications and medical equipment',
          'Supplies for elderly family members',
          'Consider dietary restrictions',
          'Glasses, hearing aids, and batteries',
          'Important family documents',
          'Cash and credit cards',
        ],
      },
    ],
  },
];

export const getGuidesByCategory = (category: string) => {
  if (category === 'all') return preparednessGuides;
  return preparednessGuides.filter(guide => guide.category === category);
};

export const getGuideById = (id: number) => {
  return preparednessGuides.find(guide => guide.id === id);
};

export const searchGuides = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return preparednessGuides.filter(
    guide =>
      guide.title.toLowerCase().includes(lowerQuery) ||
      guide.description.toLowerCase().includes(lowerQuery) ||
      guide.content.some(section =>
        section.heading.toLowerCase().includes(lowerQuery) ||
        section.items.some(item => item.toLowerCase().includes(lowerQuery))
      )
  );
};
