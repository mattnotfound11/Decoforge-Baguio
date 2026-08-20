/**
 * The materials catalog.
 *
 * `baselineStock` is the on-hand count the showroom starts the day with.
 * Live availability is layered on top of this by lib/stock.ts — see that file
 * for how to point it at a real inventory system.
 */

export type CategoryId = "pvc-ceilings" | "fluted-panels" | "decking";

export type Tone =
  | "dust-grey" | "matte-white" | "ash" | "ivory"
  | "terracotta" | "natural-oak" | "mahogany" | "espresso" | "pinewood"
  | "charcoal" | "cedar" | "bronze";

export type Surface = "fluted" | "deck" | "ceiling";

export interface Material {
  slug: string;
  name: string;
  finish: string;
  category: CategoryId;
  surface: Surface;
  tone: Tone;
  /** Showroom price, per piece, in pesos. */
  pricePhp: number;
  /** Export price per square foot, quoted on the spec sheet. */
  priceUsdSqft: number;
  unit: string;
  baselineStock: number;
  leadTime: string;
  sustainable: boolean;
  featured: boolean;
  summary: string;
  description: string;
  specs: {
    dimensions: string;
    composition: string;
    installation: string;
    fireRating: string;
    acoustic: string;
    maintenance: string;
  };
  /** Slugs of materials shown as "Suggested Pairings". */
  pairings: string[];
}

export const categories: { id: CategoryId | "all"; label: string }[] = [
  { id: "all", label: "All Materials" },
  { id: "pvc-ceilings", label: "PVC Ceilings" },
  { id: "fluted-panels", label: "Fluted Panels" },
  { id: "decking", label: "Decking" },
];

export const categoryLabel = (id: CategoryId) =>
  ({ "pvc-ceilings": "PVC Ceiling", "fluted-panels": "Fluted Panel", decking: "Decking" })[id];

export const materials: Material[] = [
  {
    slug: "dust-grey-profile",
    name: "Dust Grey Profile",
    finish: "Dust Grey",
    category: "pvc-ceilings",
    surface: "ceiling",
    tone: "dust-grey",
    pricePhp: 650,
    priceUsdSqft: 11.5,
    unit: "pc",
    baselineStock: 184,
    leadTime: "In stock — same week",
    sustainable: true,
    featured: true,
    summary: "Lightweight, moisture-resistant ceiling profile with a soft matte grey face.",
    description:
      "Our most-specified ceiling profile. The dust grey face reads as a soft neutral under warm light, which makes it a safe pairing for both timber-heavy and monochrome rooms. The interlocking edge hides fasteners completely, so a finished ceiling shows nothing but an unbroken plane.",
    specs: {
      dimensions: "3900 mm L x 250 mm W x 8 mm T",
      composition: "Rigid PVC with mineral-filled core",
      installation: "Concealed clip on 400 mm furring",
      fireRating: "Class B (ASTM E84)",
      acoustic: "NRC 0.15",
      maintenance: "Wipe with damp cloth; no abrasives",
    },
    pairings: ["terracotta-ribbed", "charcoal-composite", "edge-trim-bronze"],
  },
  {
    slug: "matte-white-flat",
    name: "Matte White Flat",
    finish: "Matte White",
    category: "pvc-ceilings",
    surface: "ceiling",
    tone: "matte-white",
    pricePhp: 580,
    priceUsdSqft: 10.2,
    unit: "pc",
    baselineStock: 240,
    leadTime: "In stock — same week",
    sustainable: true,
    featured: true,
    summary: "A flat, seamless white ceiling plane with no visible fastener line.",
    description:
      "The quietest ceiling we make. A true flat face with a low-sheen white that will not yellow under Baguio's humidity swings, specified constantly for clinics, offices, and any room where the ceiling should disappear.",
    specs: {
      dimensions: "3900 mm L x 300 mm W x 8 mm T",
      composition: "Rigid PVC, UV-stabilised",
      installation: "Concealed clip on 400 mm furring",
      fireRating: "Class B (ASTM E84)",
      acoustic: "NRC 0.15",
      maintenance: "Wipe with damp cloth; no abrasives",
    },
    pairings: ["natural-oak-slats", "dust-grey-profile", "cedar-composite"],
  },
  {
    slug: "espresso-linear-ceiling",
    name: "Linear PVC Ceiling Panel",
    finish: "Espresso",
    category: "pvc-ceilings",
    surface: "ceiling",
    tone: "espresso",
    pricePhp: 780,
    priceUsdSqft: 13.4,
    unit: "pc",
    baselineStock: 62,
    leadTime: "In stock — same week",
    sustainable: false,
    featured: false,
    summary: "Deep espresso linear ceiling that matches the warmth of mahogany panelling.",
    description:
      "A linear ceiling in a deep espresso tone, cut to run with the grain of a mahogany feature wall. Most often specified as a ceiling-and-wall pair so a room reads as one continuous timber envelope.",
    specs: {
      dimensions: "3900 mm L x 200 mm W x 9 mm T",
      composition: "Rigid PVC with wood-grain lamination",
      installation: "Concealed clip on 400 mm furring",
      fireRating: "Class B (ASTM E84)",
      acoustic: "NRC 0.20",
      maintenance: "Wipe with damp cloth; no abrasives",
    },
    pairings: ["mahogany-fluted-panel", "terra-composite-decking", "edge-trim-bronze"],
  },
  {
    slug: "honeycomb-white-ceiling",
    name: "Honeycomb White",
    finish: "Honeycomb White",
    category: "pvc-ceilings",
    surface: "ceiling",
    tone: "ivory",
    pricePhp: 720,
    priceUsdSqft: 12.6,
    unit: "pc",
    baselineStock: 8,
    leadTime: "2 weeks on reorder",
    sustainable: true,
    featured: false,
    summary: "Honeycomb-core panel that halves the weight without losing rigidity.",
    description:
      "A honeycomb core makes this the panel to reach for on long unsupported spans. It weighs close to half what a solid profile does, which matters when a ceiling has to go up over an occupied retail floor.",
    specs: {
      dimensions: "3900 mm L x 300 mm W x 10 mm T",
      composition: "PVC skin over honeycomb core",
      installation: "Concealed clip on 600 mm furring",
      fireRating: "Class B (ASTM E84)",
      acoustic: "NRC 0.25",
      maintenance: "Wipe with damp cloth; no abrasives",
    },
    pairings: ["matte-white-flat", "natural-oak-slats", "edge-trim-bronze"],
  },
  {
    slug: "terracotta-ribbed",
    name: "Terracotta Ribbed",
    finish: "Terracotta",
    category: "fluted-panels",
    surface: "fluted",
    tone: "terracotta",
    pricePhp: 1200,
    priceUsdSqft: 38.0,
    unit: "pc",
    baselineStock: 96,
    leadTime: "In stock — same week",
    sustainable: true,
    featured: true,
    summary: "Warm terracotta ribs that throw a strong shadow line in raking light.",
    description:
      "The rib pitch on this panel is deliberately wide, so a wall picks up a long shadow as the sun moves. It is the panel we specify when a room needs one warm surface to hold everything else together.",
    specs: {
      dimensions: "2900 mm H x 160 mm W x 20 mm D",
      composition: "WPC (Wood Plastic Composite) core",
      installation: "Interlocking tongue & groove, concealed fasteners",
      fireRating: "Class A (ASTM E84)",
      acoustic: "NRC 0.60 (with backing)",
      maintenance: "Wipe clean with damp cloth. Do not use abrasives.",
    },
    pairings: ["dust-grey-profile", "cedar-composite", "edge-trim-bronze"],
  },
  {
    slug: "natural-oak-slats",
    name: "Natural Oak Slats",
    finish: "Natural Oak",
    category: "fluted-panels",
    surface: "fluted",
    tone: "natural-oak",
    pricePhp: 1450,
    priceUsdSqft: 41.5,
    unit: "pc",
    baselineStock: 128,
    leadTime: "In stock — same week",
    sustainable: true,
    featured: true,
    summary: "Pale oak slats on a fine pitch, the quietest panel in the range.",
    description:
      "A fine-pitch slat in pale oak. Because the ribs sit close together the panel reads almost as a texture rather than a pattern, which is what makes it work across a whole room instead of a single feature wall.",
    specs: {
      dimensions: "2900 mm H x 160 mm W x 20 mm D",
      composition: "WPC (Wood Plastic Composite) core",
      installation: "Interlocking tongue & groove, concealed fasteners",
      fireRating: "Class A (ASTM E84)",
      acoustic: "NRC 0.65 (with backing)",
      maintenance: "Wipe clean with damp cloth. Do not use abrasives.",
    },
    pairings: ["matte-white-flat", "cedar-composite", "edge-trim-bronze"],
  },
  {
    slug: "mahogany-fluted-panel",
    name: "Premium Fluted Panel",
    finish: "Mahogany Finish",
    category: "fluted-panels",
    surface: "fluted",
    tone: "mahogany",
    pricePhp: 1680,
    priceUsdSqft: 45.0,
    unit: "pc",
    baselineStock: 74,
    leadTime: "2–3 Weeks",
    sustainable: true,
    featured: true,
    summary: "Our signature panel: deep mahogany, acoustic backing, concealed fixings.",
    description:
      "Our signature architectural wall panelling. Crafted for seamless installation, exceptional acoustic dampening, and striking visual depth. Perfect for feature walls, commercial lobbies, and refined residential interiors.",
    specs: {
      dimensions: '114" H x 6.5" W x 0.8" D',
      composition: "WPC (Wood Plastic Composite) Core",
      installation: "Interlocking Tongue & Groove, Concealed Fasteners",
      fireRating: "Class A (ASTM E84)",
      acoustic: "NRC 0.65 (with backing)",
      maintenance: "Wipe clean with damp cloth. Do not use abrasives.",
    },
    pairings: ["espresso-linear-ceiling", "terra-composite-decking", "edge-trim-bronze"],
  },
  {
    slug: "royal-white-fluted",
    name: "Royal White Fluted",
    finish: "Royal White",
    category: "fluted-panels",
    surface: "fluted",
    tone: "ivory",
    pricePhp: 1320,
    priceUsdSqft: 36.5,
    unit: "pc",
    baselineStock: 41,
    leadTime: "In stock — same week",
    sustainable: false,
    featured: false,
    summary: "A paintable white flute for interiors that want relief without colour.",
    description:
      "Supplied primed and paintable. Specifiers use this when the room wants the rhythm of a fluted wall but the colour has to match an existing scheme exactly.",
    specs: {
      dimensions: "2900 mm H x 160 mm W x 20 mm D",
      composition: "WPC core, primed face",
      installation: "Interlocking tongue & groove, concealed fasteners",
      fireRating: "Class A (ASTM E84)",
      acoustic: "NRC 0.60 (with backing)",
      maintenance: "Repaintable; clean with damp cloth",
    },
    pairings: ["matte-white-flat", "dust-grey-profile", "charcoal-composite"],
  },
  {
    slug: "charcoal-composite",
    name: "Charcoal Composite",
    finish: "Charcoal",
    category: "decking",
    surface: "deck",
    tone: "charcoal",
    pricePhp: 2100,
    priceUsdSqft: 22.0,
    unit: "pc",
    baselineStock: 9,
    leadTime: "3 weeks on reorder",
    sustainable: true,
    featured: true,
    summary: "Dense charcoal WPC board with a grooved, slip-resistant face.",
    description:
      "A dense composite board in a deep charcoal that holds its colour through Baguio's wet season. The grooved face keeps its grip when wet, which is the whole reason it gets specified for terraces on sloping lots.",
    specs: {
      dimensions: "2900 mm L x 140 mm W x 25 mm T",
      composition: "WPC, 60% reclaimed hardwood fibre",
      installation: "Hidden clip on 400 mm joists",
      fireRating: "Class B (ASTM E84)",
      acoustic: "Not rated (exterior)",
      maintenance: "Rinse seasonally; no sealing required",
    },
    pairings: ["cedar-composite", "terracotta-ribbed", "edge-trim-bronze"],
  },
  {
    slug: "cedar-composite",
    name: "Cedar Composite",
    finish: "Cedar Tone",
    category: "decking",
    surface: "deck",
    tone: "cedar",
    pricePhp: 2100,
    priceUsdSqft: 22.0,
    unit: "pc",
    baselineStock: 156,
    leadTime: "In stock — same week",
    sustainable: true,
    featured: true,
    summary: "Warm cedar board for decks that need to read as timber, not plastic.",
    description:
      "The warm end of the decking range. Colour is run through the full thickness rather than printed on the face, so a scratch from a dragged chair does not show a different colour underneath.",
    specs: {
      dimensions: "2900 mm L x 140 mm W x 25 mm T",
      composition: "WPC, 60% reclaimed hardwood fibre",
      installation: "Hidden clip on 400 mm joists",
      fireRating: "Class B (ASTM E84)",
      acoustic: "Not rated (exterior)",
      maintenance: "Rinse seasonally; no sealing required",
    },
    pairings: ["charcoal-composite", "natural-oak-slats", "matte-white-flat"],
  },
  {
    slug: "terra-composite-decking",
    name: "Terra Composite Decking",
    finish: "Cedar Tone",
    category: "decking",
    surface: "deck",
    tone: "cedar",
    pricePhp: 2340,
    priceUsdSqft: 24.5,
    unit: "pc",
    baselineStock: 88,
    leadTime: "In stock — same week",
    sustainable: true,
    featured: false,
    summary: "Wide-format board for seamless indoor–outdoor thresholds.",
    description:
      "A wider board than the rest of the range, sized so a terrace can run out from an interior floor without a change in module. For seamless indoor-outdoor flow.",
    specs: {
      dimensions: "2900 mm L x 200 mm W x 25 mm T",
      composition: "WPC, 60% reclaimed hardwood fibre",
      installation: "Hidden clip on 400 mm joists",
      fireRating: "Class B (ASTM E84)",
      acoustic: "Not rated (exterior)",
      maintenance: "Rinse seasonally; no sealing required",
    },
    pairings: ["mahogany-fluted-panel", "espresso-linear-ceiling", "cedar-composite"],
  },
  {
    slug: "edge-trim-bronze",
    name: "Edge Trim Profiles",
    finish: "Brushed Bronze",
    category: "decking",
    surface: "deck",
    tone: "bronze",
    pricePhp: 460,
    priceUsdSqft: 8.0,
    unit: "pc",
    baselineStock: 310,
    leadTime: "In stock — same week",
    sustainable: false,
    featured: false,
    summary: "Brushed bronze trim that closes a panel run without a visible fixing.",
    description:
      "Architectural finish details. The trim closes the end of a panel or board run with a shadow gap rather than a butt joint, which is the difference between an installation that looks specified and one that looks assembled.",
    specs: {
      dimensions: "2900 mm L x 20 mm W x 20 mm D",
      composition: "Anodised aluminium, brushed bronze",
      installation: "Adhesive or concealed screw fix",
      fireRating: "Class A (non-combustible)",
      acoustic: "Not rated",
      maintenance: "Wipe with dry cloth",
    },
    pairings: ["mahogany-fluted-panel", "terracotta-ribbed", "charcoal-composite"],
  },
];

export const getMaterial = (slug: string) => materials.find((m) => m.slug === slug);

export const materialsByCategory = (category: CategoryId | "all") =>
  category === "all" ? materials : materials.filter((m) => m.category === category);
