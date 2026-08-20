/**
 * Catalog seed. Written to data/db.json the first time the server boots and
 * never consulted again — edit the JSON store (or delete it) to change stock.
 */

export const CATEGORIES = [
  { id: 'seating', label: 'Seating' },
  { id: 'tables', label: 'Tables' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'storage', label: 'Storage' },
  { id: 'decor', label: 'Decor' },
];

export const PROJECT_TYPES = [
  'Single piece',
  'Full room',
  'Whole home',
  'Cafe or restaurant',
  'Hotel or resort',
  'Office',
];

export const QUOTE_STATUSES = ['new', 'reviewing', 'quoted', 'won', 'closed'];

export const BUDGET_RANGES = [
  'Under PHP 25,000',
  'PHP 25,000 - 75,000',
  'PHP 75,000 - 200,000',
  'Over PHP 200,000',
  'Not sure yet',
];

export const SEED_PRODUCTS = [
  {
    id: 'p-benguet-pine-bench',
    name: 'Benguet Pine Slab Bench',
    category: 'seating',
    price: 12500,
    leadTimeDays: 21,
    materials: ['Reclaimed Benguet pine', 'Blackened steel'],
    dimensions: '150 x 40 x 45 cm',
    description:
      'A single live-edge pine slab on hand-forged steel legs. Every board is milled from storm-fallen trees sourced within Benguet, so the grain and knot pattern differ piece to piece.',
    emoji: '\u{1FA91}',
    accent: '#5c7a5e',
    featured: true,
  },
  {
    id: 'p-session-road-armchair',
    name: 'Session Road Armchair',
    category: 'seating',
    price: 18900,
    leadTimeDays: 28,
    materials: ['Kiln-dried narra', 'Handwoven abaca', 'Cotton canvas'],
    dimensions: '72 x 78 x 82 cm',
    description:
      'A low lounge chair with an abaca-wrapped back, woven in-house over a narra frame. Cushions are removable and slipcovered in heavyweight canvas.',
    emoji: '\u{1FA91}',
    accent: '#a8642e',
    featured: true,
  },
  {
    id: 'p-cordillera-dining-table',
    name: 'Cordillera Dining Table',
    category: 'tables',
    price: 46000,
    leadTimeDays: 35,
    materials: ['Solid acacia', 'Powder-coated steel'],
    dimensions: '220 x 95 x 76 cm',
    description:
      'Eight-seater plank table with breadboard ends and a trestle base. Finished in a matte hardwax oil that can be spot-repaired instead of refinished.',
    emoji: '\u{1F5C3}',
    accent: '#8a5a33',
    featured: true,
  },
  {
    id: 'p-mist-side-table',
    name: 'Mist Nesting Side Tables',
    category: 'tables',
    price: 8900,
    leadTimeDays: 14,
    materials: ['Ash veneer', 'Brushed brass'],
    dimensions: 'Set of two, 45 and 38 cm diameter',
    description:
      'A pair of round nesting tables with brass collars. The smaller tucks fully beneath the larger, which is useful in the tight floor plans of older Baguio houses.',
    emoji: '\u{1FA9E}',
    accent: '#6b7f8c',
    featured: false,
  },
  {
    id: 'p-capiz-pendant',
    name: 'Capiz Cascade Pendant',
    category: 'lighting',
    price: 15400,
    leadTimeDays: 24,
    materials: ['Capiz shell', 'Antique brass', 'Fabric cord'],
    dimensions: '55 cm diameter, 90 cm drop',
    description:
      'Three tiers of hand-cut capiz discs strung on brass rings. Ships with a 3 m adjustable cord and an E27 warm-white bulb.',
    emoji: '\u{1F4A1}',
    accent: '#c9963f',
    featured: true,
  },
  {
    id: 'p-ifugao-sconce',
    name: 'Ifugao Carved Wall Sconce',
    category: 'lighting',
    price: 6800,
    leadTimeDays: 18,
    materials: ['Hand-carved kamagong', 'Copper'],
    dimensions: '18 x 12 x 32 cm',
    description:
      'Wall light with a relief pattern carved by partner artisans in Ifugao, backed by a copper reflector that throws a warm upward wash.',
    emoji: '\u{1F56F}',
    accent: '#7a4a3a',
    featured: false,
  },
  {
    id: 'p-burnham-shelving',
    name: 'Burnham Modular Shelving',
    category: 'storage',
    price: 32000,
    leadTimeDays: 30,
    materials: ['Marine plywood', 'Oak veneer', 'Steel uprights'],
    dimensions: '180 x 35 x 200 cm',
    description:
      'Wall-anchored shelving on a 30 cm module. Add or move shelves later without new hardware; uprights are drilled the full height.',
    emoji: '\u{1F4DA}',
    accent: '#4f6b63',
    featured: false,
  },
  {
    id: 'p-highland-sideboard',
    name: 'Highland Sideboard',
    category: 'storage',
    price: 38500,
    leadTimeDays: 32,
    materials: ['Solid mahogany', 'Rattan cane webbing', 'Brass pulls'],
    dimensions: '160 x 45 x 80 cm',
    description:
      'Four-door sideboard with caned fronts for ventilation, soft-close hinges, and an interior divided for both plates and linens.',
    emoji: '\u{1F5C4}',
    accent: '#8f5f4d',
    featured: true,
  },
  {
    id: 'p-pinewood-mirror',
    name: 'Pinewood Arch Mirror',
    category: 'decor',
    price: 9600,
    leadTimeDays: 16,
    materials: ['Benguet pine', '6 mm float glass'],
    dimensions: '70 x 3 x 140 cm',
    description:
      'Full-length arched mirror in a hand-shaped pine frame. Supplied with French cleat hardware rated for concrete or wood studs.',
    emoji: '\u{1FA9E}',
    accent: '#9a7b56',
    featured: false,
  },
  {
    id: 'p-woven-panel',
    name: 'Cordillera Woven Wall Panel',
    category: 'decor',
    price: 7200,
    leadTimeDays: 20,
    materials: ['Handwoven cotton', 'Natural dyes', 'Pine batten'],
    dimensions: '120 x 90 cm',
    description:
      'Backstrap-loom textile mounted on a floating pine batten, woven by weavers we work with year-round rather than per order.',
    emoji: '\u{1F9F5}',
    accent: '#a4553f',
    featured: false,
  },
];
