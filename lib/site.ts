/**
 * Brand facts, taken from the official Facebook page:
 * https://www.facebook.com/people/Decoforge-Home-And-Aesthetics/61578740650682/
 *
 * Keep this file the single source of truth — the header, footer, contact page,
 * booking emails, and spec sheets all read from it.
 */

export const site = {
  name: "Decoforge",
  legalName: "Decoforge Home And Aesthetics",
  tagline: "Elevate your space with affordable and premium home decor finishes",
  description:
    "Decoforge Home And Aesthetics supplies and installs affordable, premium home decor finishes in Baguio City — UV marble boards, PVC ceilings, fluted wall panels, and WPC decking.",
  category: "Construction Company · Home Decor · Home Improvement",

  phone: "0963 271 2356",
  phoneHref: "tel:+639632712356",
  email: "decoforge.homeaesthetic@gmail.com",

  facebook: "https://www.facebook.com/people/Decoforge-Home-And-Aesthetics/61578740650682/",
  facebookHandle: "Decoforge Home And Aesthetics",
  messenger: "https://m.me/61578740650682",
  followers: "2.8K",

  showroom: {
    line1: "Irisan, Baguio City",
    line2: "Philippines, 2600",
    mapHref: "https://maps.google.com/?q=Irisan,+Baguio+City,+Philippines",
  },

  /** The Facebook page lists the business as always open. */
  hours: {
    weekdays: "Open daily",
    weekend: "Message us any time",
  },
} as const;

export const primaryNav = [
  { label: "Services", href: "/#services" },
  { label: "Projects", href: "/projects" },
  { label: "Catalog", href: "/catalog" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Careers", href: "/careers" },
] as const;

/** Photography. Every id below was verified to resolve before being committed. */
export const photo = {
  heroInterior: "photo-1600607687939-ce8a6c25118c",
  alpineResidence: "photo-1618221195710-dd6b41faaea6",
  modernistVilla: "photo-1556909212-d5b604d0c90d",
  pinesStudio: "photo-1521737604893-d14cc237f11d",
  darkLoft: "photo-1505873242700-f289a29e1e0f",
  slatWall: "photo-1604014237800-1c9102c219da",
  villaDusk: "photo-1600585154340-be6161a56a0c",
  villaPool: "photo-1512917774080-9991f1c4c750",
  openLiving: "photo-1503174971373-b1f69850bded",
  officeLounge: "photo-1524758631624-e2822e304c36",
  atrium: "photo-1502005229762-cf1b2da7c5d6",
  warmLiving: "photo-1615529182904-14819c35db37",
} as const;

export const unsplash = (id: string, w = 1200, q = 78) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
