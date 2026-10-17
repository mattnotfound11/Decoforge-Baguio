"use client";

import { useEffect, useRef, useState } from "react";
import type { Material } from "@/lib/materials";
import { SURFACES, type Dims, type SurfaceId } from "@/lib/room";
import type { Mood, RoomStage, View } from "@/lib/room-stage";

/**
 * Hosts the WebGL room. three.js and the stage load only when the composer
 * comes within a screen or so of the viewport, so the rest of the home page
 * never waits on them. Until then, and on devices without WebGL, it shows a
 * line drawing of the room (or `fallback`) in its place.
 */

type Status = "waiting" | "ready" | "fallback";

/** What the page can ask of the stage directly. */
export interface SceneApi {
  zoomBy: (factor: number) => void;
}

interface Props {
  dims: Dims;
  finishes: Record<SurfaceId, Material | null>;
  mood: Mood;
  view: View;
  /** Bumped when the same view is chosen again, to recentre after a drag. */
  viewNonce: number;
  /** The surface being edited; the camera swings round if it can't see it. */
  focus: SurfaceId;
  label: string;
  api: React.RefObject<SceneApi | null>;
  onPick: (surface: SurfaceId) => void;
  onHover: (surface: SurfaceId | null, x: number, y: number) => void;
  onHeading: (azimuth: number) => void;
  onView: (view: View) => void;
  onZoomHint: () => void;
  fallback: React.ReactNode;
  /** Called once if the 3D room can't be drawn here. */
  onFallback?: () => void;
}

export function RoomScene(props: Props) {
  const { dims, finishes, mood, view, viewNonce, focus, label, fallback } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stage = useRef<RoomStage | null>(null);
  const [status, setStatus] = useState<Status>("waiting");

  // The stage is built from whatever the props are when it finishes loading.
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });
  useEffect(() => {
    if (status === "fallback") latest.current.onFallback?.();
  }, [status]);

  useEffect(() => {
    const el = wrap.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    let onScreen: IntersectionObserver | undefined;

    const load = async () => {
      try {
        const { RoomStage } = await import("@/lib/room-stage");
        if (cancelled) return;
        const p = latest.current;
        const s = new RoomStage(canvas, {
          dims: p.dims,
          finishes: p.finishes,
          mood: p.mood,
          view: p.view,
          interactive: window.matchMedia("(hover: hover) and (pointer: fine)").matches,
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          onPick: (surface) => latest.current.onPick(surface),
          onHover: (surface, x, y) => latest.current.onHover(surface, x, y),
          onHeading: (azimuth) => latest.current.onHeading(azimuth),
          onView: (v) => latest.current.onView(v),
          onZoomHint: () => latest.current.onZoomHint(),
          onLost: () => setStatus("fallback"),
        });
        stage.current = s;
        latest.current.api.current = { zoomBy: (factor) => s.zoomBy(factor) };
        s.resize(el.clientWidth, el.clientHeight);
        resize = new ResizeObserver(([entry]) => s.resize(entry.contentRect.width, entry.contentRect.height));
        resize.observe(el);
        onScreen = new IntersectionObserver(
          ([entry]) => {
            s.setVisible(entry.isIntersecting);
            if (entry.intersectionRatio >= 0.45) s.playIntro();
          },
          { threshold: [0, 0.45] },
        );
        onScreen.observe(el);
        setStatus("ready");
      } catch {
        // No WebGL, or the chunk failed to load: the drawing stands in.
        if (!cancelled) setStatus("fallback");
      }
    };

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        void load();
      },
      { rootMargin: "600px 0px" },
    );
    near.observe(el);

    return () => {
      cancelled = true;
      latest.current.api.current = null;
      near.disconnect();
      resize?.disconnect();
      onScreen?.disconnect();
      stage.current?.dispose();
      stage.current = null;
    };
  }, []);

  useEffect(() => stage.current?.setRoom(dims), [dims, status]);
  useEffect(() => {
    const s = stage.current;
    if (!s) return;
    for (const { id } of SURFACES) s.setFinish(id, finishes[id]);
  }, [finishes, status]);
  useEffect(() => stage.current?.reveal(focus), [focus, status]);
  useEffect(() => stage.current?.setMood(mood), [mood, status]);
  useEffect(() => stage.current?.setView(view, viewNonce > 0), [view, viewNonce, status]);

  return (
    <div ref={wrap} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className={`absolute inset-0 h-full w-full outline-none transition-opacity duration-1000 ease-out ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
      {status === "fallback" ? fallback : <Poster hidden={status === "ready"} />}
    </div>
  );
}

/** A one-point perspective of the room in fine line, while the 3D loads. */
function Poster({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${hidden ? "opacity-0" : "opacity-100"}`}
    >
      <svg viewBox="0 0 400 260" className="h-[62%] w-auto text-white/25" fill="none" stroke="currentColor" strokeWidth="1">
        <rect x="20" y="16" width="360" height="228" />
        <rect x="120" y="72" width="160" height="104" />
        <path d="M20 16L120 72M380 16L280 72M20 244L120 176M380 244L280 176" />
        <path d="M44 108l36 12v52l-36-14z" strokeDasharray="3 4" />
        <path d="M120 176h160" className="animate-pulse text-ember/60" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <p className="absolute bottom-[18%] text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">Drawing your room</p>
    </div>
  );
}
