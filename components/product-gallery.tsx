"use client";

import Image from "next/image";
import { useState } from "react";
import { MaterialArt } from "./material-art";
import { unsplash } from "@/lib/site";
import type { Surface, Tone } from "@/lib/materials";

type View = { kind: "art" } | { kind: "photo"; id: string; alt: string };

export function ProductGallery({
  surface,
  tone,
  name,
  photos,
}: {
  surface: Surface;
  tone: Tone;
  name: string;
  photos: { id: string; alt: string }[];
}) {
  const views: View[] = [{ kind: "art" }, ...photos.map((p) => ({ kind: "photo" as const, ...p }))];
  const [active, setActive] = useState(0);
  const current = views[active];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-cream-2">
        {current.kind === "art" ? (
          <MaterialArt surface={surface} tone={tone} className="h-full w-full" />
        ) : (
          <Image
            src={unsplash(current.id, 1100)}
            alt={current.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {views.map((view, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={
              view.kind === "art" ? `${name} material sample` : `${name} installed — view ${i}`
            }
            aria-current={active === i}
            className={[
              "relative aspect-[4/3] overflow-hidden rounded-lg transition",
              active === i ? "ring-2 ring-rust ring-offset-2 ring-offset-cream" : "ring-1 ring-stone hover:ring-rust/50",
            ].join(" ")}
          >
            {view.kind === "art" ? (
              <MaterialArt surface={surface} tone={tone} className="h-full w-full" />
            ) : (
              <Image
                src={unsplash(view.id, 400)}
                alt=""
                fill
                sizes="180px"
                className="object-cover"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
