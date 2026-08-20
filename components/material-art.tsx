import type { Surface, Tone } from "@/lib/materials";

/**
 * Procedurally drawn material samples.
 *
 * The catalog needs a consistent, crisp sample for every finish. Stock photos
 * of ribbed panels vary wildly in lighting and crop, so these are drawn instead
 * — one gradient ramp per finish, three surface treatments, scalable to any size.
 */

interface Ramp {
  light: string;
  base: string;
  dark: string;
  deep: string;
}

const TONES: Record<Tone, Ramp> = {
  "dust-grey": { light: "#c2bcb5", base: "#a09992", dark: "#7a736c", deep: "#565049" },
  "matte-white": { light: "#fbf9f6", base: "#efeae2", dark: "#d5cec3", deep: "#b3aa9d" },
  ash: { light: "#cfc7bd", base: "#ada49a", dark: "#847b71", deep: "#5e564e" },
  ivory: { light: "#f8f2e8", base: "#ebe2d2", dark: "#d0c3ac", deep: "#ad9d82" },
  terracotta: { light: "#dc8049", base: "#c25e28", dark: "#93421a", deep: "#682c10" },
  "natural-oak": { light: "#e0be8f", base: "#c69c6d", dark: "#9b7146", deep: "#6d4d2d" },
  mahogany: { light: "#954d32", base: "#703522", dark: "#4d2216", deep: "#31140c" },
  espresso: { light: "#5e4232", base: "#442e21", dark: "#2f1e15", deep: "#1c110b" },
  pinewood: { light: "#e6c79b", base: "#cfa877", dark: "#a67f50", deep: "#775734" },
  charcoal: { light: "#514f4a", base: "#3a3835", dark: "#272520", deep: "#171510" },
  cedar: { light: "#ad7442", base: "#8b5b35", dark: "#623d21", deep: "#402714" },
  bronze: { light: "#b6915d", base: "#8f6e40", dark: "#654b2b", deep: "#43311c" },
};

interface Props {
  surface: Surface;
  tone: Tone;
  className?: string;
}

export function MaterialArt({ surface, tone, className }: Props) {
  const c = TONES[tone];
  // Stable per finish+surface. Identical combinations share identical defs,
  // so a repeat on the same page is harmless.
  const uid = `${surface}-${tone}`;

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`rib-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={c.deep} />
          <stop offset="18%" stopColor={c.dark} />
          <stop offset="44%" stopColor={c.light} />
          <stop offset="68%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.deep} />
        </linearGradient>

        <linearGradient id={`board-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="35%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.dark} />
        </linearGradient>

        <linearGradient id={`panel-${uid}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.dark} />
        </linearGradient>

        <linearGradient id={`sheen-${uid}`} x1="0" x2="0.6" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill={c.deep} />

      {surface === "fluted" && <Fluted uid={uid} ramp={c} />}
      {surface === "deck" && <Deck uid={uid} ramp={c} />}
      {surface === "ceiling" && <Ceiling uid={uid} ramp={c} />}

      <rect width="400" height="300" fill={`url(#sheen-${uid})`} />
    </svg>
  );
}

/** Vertical ribs. The gradient across each rib is what reads as a rounded profile. */
function Fluted({ uid, ramp }: { uid: string; ramp: Ramp }) {
  const count = 17;
  const pitch = 400 / count;
  const ribWidth = pitch * 0.82;

  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const x = i * pitch;
        return (
          <g key={i}>
            <rect x={x} y={0} width={ribWidth} height={300} fill={`url(#rib-${uid})`} />
            {/* Shadow in the valley between ribs. */}
            <rect
              x={x + ribWidth}
              y={0}
              width={pitch - ribWidth}
              height={300}
              fill={ramp.deep}
            />
            {/* Specular line just off the rib crown. */}
            <rect
              x={x + ribWidth * 0.36}
              y={0}
              width={0.9}
              height={300}
              fill="#fff"
              opacity={0.16}
            />
          </g>
        );
      })}
    </g>
  );
}

/** Horizontal boards with a groove between each and a little grain. */
function Deck({ uid, ramp }: { uid: string; ramp: Ramp }) {
  const count = 6;
  const pitch = 300 / count;
  const boardHeight = pitch * 0.9;

  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const y = i * pitch;
        return (
          <g key={i}>
            <rect x={0} y={y} width={400} height={boardHeight} fill={`url(#board-${uid})`} />
            <rect
              x={0}
              y={y + boardHeight}
              width={400}
              height={pitch - boardHeight}
              fill={ramp.deep}
            />
            {/* Grain: a few long, low-contrast strokes per board. */}
            {[0.22, 0.44, 0.63, 0.81].map((t, j) => (
              <rect
                key={j}
                x={((i * 53 + j * 97) % 120) - 30}
                y={y + boardHeight * t}
                width={300 + ((i * 37 + j * 61) % 120)}
                height={0.9}
                fill={ramp.deep}
                opacity={0.3}
              />
            ))}
            {/* Machined groove near the board's top edge. */}
            <rect x={0} y={y + 2} width={400} height={1.2} fill="#fff" opacity={0.09} />
          </g>
        );
      })}
    </g>
  );
}

/** Installed ceiling boards: a bevelled seam per board, plus a soft light fall. */
function Ceiling({ uid, ramp }: { uid: string; ramp: Ramp }) {
  const count = 6;
  const pitch = 400 / count;

  return (
    <g>
      <rect width="400" height="300" fill={`url(#panel-${uid})`} />

      {Array.from({ length: count }, (_, i) => {
        const x = i * pitch;
        return (
          <g key={i}>
            {/* Alternate boards sit a hair darker, as a real run does. */}
            {i % 2 === 1 && (
              <rect x={x} y={0} width={pitch} height={300} fill={ramp.dark} opacity={0.14} />
            )}
            {/* Bevelled joint: shadow on the closing edge, highlight on the next. */}
            <rect x={x + pitch - 2.4} y={0} width={2.4} height={300} fill={ramp.deep} opacity={0.7} />
            <rect x={x + pitch} y={0} width={1.1} height={300} fill="#fff" opacity={0.16} />
          </g>
        );
      })}

      {/* Light washing across the plane from the near corner. */}
      <ellipse cx="110" cy="30" rx="250" ry="130" fill="#fff" opacity={0.09} />
      <rect y="268" width="400" height="32" fill={ramp.deep} opacity={0.18} />
    </g>
  );
}
