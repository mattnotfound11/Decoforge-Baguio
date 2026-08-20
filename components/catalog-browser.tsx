"use client";

import { useMemo, useState } from "react";
import { MaterialCard } from "./material-card";
import { categories, type CategoryId, type Material } from "@/lib/materials";
import { useAgo, useStock } from "@/lib/use-stock";

const PAGE = 6;

export function CatalogBrowser({
  materials,
  initialCategory = "all",
}: {
  materials: Material[];
  initialCategory?: CategoryId | "all";
}) {
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const snapshot = useStock();
  const ago = useAgo(snapshot?.checkedAt);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return materials.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (!q) return true;
      return [m.name, m.finish, m.summary, m.description, m.specs.composition]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [materials, category, query]);

  const visible = results.slice(0, shown);

  return (
    <div>
      <div className="rounded-2xl bg-cream-2/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setCategory(c.id);
                    setShown(PAGE);
                  }}
                  className={[
                    "rounded-full px-5 py-2.5 text-[14px] font-semibold transition",
                    active
                      ? "bg-rust text-white"
                      : "bg-white text-ink/75 ring-1 ring-stone hover:ring-rust/40",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="relative lg:ml-auto lg:w-[320px]">
            <label htmlFor="catalog-search" className="sr-only">
              Search catalog
            </label>
            <svg
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true"
            >
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShown(PAGE);
              }}
              placeholder="Search catalog…"
              className="w-full rounded-full border border-stone bg-white py-3 pl-11 pr-4 text-[15px] outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/20"
            />
          </div>
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2f8f5b] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2f8f5b]" />
            </span>
            Live availability
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {results.length} {results.length === 1 ? "material" : "materials"}
          </span>
          {ago && (
            <>
              <span aria-hidden="true">·</span>
              <span>stock checked {ago}</span>
            </>
          )}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-2 px-6 py-20 text-center">
          <p className="text-lg font-semibold">No materials match that search.</p>
          <p className="mt-2 text-[15px] text-muted">
            We fabricate outside the catalog too — tell us what you need.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="mt-6 rounded-lg border border-stone-2 px-5 py-2.5 text-[15px] font-semibold transition hover:bg-cream-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => (
            <MaterialCard key={m.slug} material={m} />
          ))}
        </div>
      )}

      {shown < results.length && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="rounded-lg border border-ink/20 px-7 py-3.5 text-[15px] font-semibold transition hover:border-ink hover:bg-ink hover:text-cream"
          >
            Load More Materials
          </button>
        </div>
      )}
    </div>
  );
}
