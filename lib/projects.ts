import { photo } from "./site";

export interface Project {
  slug: string;
  name: string;
  kind: "Residential" | "Commercial";
  kindLabel: string;
  location: string;
  area: string;
  blurb: string;
  materials: string[];
  image: string;
}

export const projects: Project[] = [
  {
    slug: "alpine-residence",
    name: "The Alpine Residence",
    kind: "Residential",
    kindLabel: "Private Residence",
    location: "Baguio City",
    area: "4,500 sq ft",
    blurb:
      "A stunning mountain retreat blending natural textures with modern precision. The extensive use of our Fluted Panels adds acoustic warmth and visual rhythm to the expansive living spaces.",
    materials: ["Fluted Panels", "WPC Decking"],
    image: photo.alpineResidence,
  },
  {
    slug: "modernist-villa",
    name: "Modernist Villa",
    kind: "Residential",
    kindLabel: "Private Residence",
    location: "Camp John Hay",
    area: "2,200 sq ft",
    blurb:
      "Clean lines and pristine surfaces define this contemporary villa. Our seamless PVC Ceilings provide a flawless finish that carries light deep into the plan without a single visible fixing.",
    materials: ["PVC Ceilings"],
    image: photo.modernistVilla,
  },
  {
    slug: "pines-studio",
    name: "Pines Studio",
    kind: "Commercial",
    kindLabel: "Commercial Space",
    location: "Session Road",
    area: "1,800 sq ft",
    blurb:
      "An inspiring workspace designed for creatives. The integration of high-performance architectural films and textured acoustic surfaces creates an environment that is both aesthetically pleasing and highly functional.",
    materials: ["Fluted Panels", "PVC Ceilings"],
    image: photo.pinesStudio,
  },
];

/** Images used by the Project Gallery grid on the home page. */
export const galleryShots = [
  { id: photo.slatWall, caption: "Fluted mahogany feature wall", place: "Outlook Drive" },
  { id: photo.darkLoft, caption: "Espresso linear ceiling", place: "Session Road" },
  { id: photo.villaDusk, caption: "Terrace in cedar composite", place: "Camp John Hay" },
  { id: photo.openLiving, caption: "Natural oak slat partition", place: "Loakan" },
  { id: photo.officeLounge, caption: "Acoustic lounge panelling", place: "Military Cut-off" },
  { id: photo.atrium, caption: "Full-height atrium panelling", place: "Mines View" },
];
