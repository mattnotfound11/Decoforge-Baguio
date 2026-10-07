import { createElement, type ReactNode } from "react";

type Tag = "h1" | "h2" | "h3" | "p" | "span";

interface Part {
  text: string;
  className?: string;
}

/**
 * A headline whose words rise out of their own line box, one after another.
 *
 * Server-rendered: the words are in the HTML, so the heading reads correctly
 * to crawlers and screen readers (the visual copy is aria-hidden and the full
 * string is given once as the label). ScrollReveal adds `is-visible`.
 *
 * Pass `parts` to style runs differently — an italic accent phrase, say — and
 * `"\n"` inside a part to force a line break.
 */
export function SplitText({
  as = "h2",
  parts,
  className,
  delay = 0,
}: {
  as?: Tag;
  parts: (string | Part)[];
  className?: string;
  /** Index offset, so a second line can continue the first line's cascade. */
  delay?: number;
}) {
  const runs = parts.map((p) => (typeof p === "string" ? { text: p } : p));
  const label = runs.map((r) => r.text.replace(/\n/g, " ")).join("").replace(/\s+/g, " ").trim();

  let i = delay;
  const children: ReactNode[] = [];

  runs.forEach((run, r) => {
    run.text.split("\n").forEach((line, l) => {
      if (l > 0) children.push(<br key={`br-${r}-${l}`} />);
      line.split(/(\s+)/).forEach((token, t) => {
        if (token === "") return;
        if (/^\s+$/.test(token)) {
          children.push(" ");
          return;
        }
        children.push(
          <span key={`${r}-${l}-${t}`} className={["w", run.className].filter(Boolean).join(" ")}>
            <span style={{ "--i": i++ } as React.CSSProperties}>{token}</span>
          </span>,
        );
      });
    });
  });

  return createElement(
    as,
    { className, "data-split": "", "aria-label": label },
    <span aria-hidden="true">{children}</span>,
  );
}
