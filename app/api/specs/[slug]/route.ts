import { NextResponse } from "next/server";
import { categoryLabel, getMaterial } from "@/lib/materials";
import { formatPeso, formatPesoRate, pesoPerSqft } from "@/lib/format";
import { getStockSnapshot } from "@/lib/stock";
import { site } from "@/lib/site";

/** Plain-text spec sheet behind the "Download Specs & CAD" button. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const material = getMaterial(slug);
  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stock = await getStockSnapshot();
  const level = stock.levels[material.slug];
  const rule = "=".repeat(64);

  const sheet = `${rule}
${site.legalName.toUpperCase()}
TECHNICAL SPECIFICATION SHEET
${rule}

PRODUCT           ${material.name} — ${material.finish}
CATEGORY          ${categoryLabel(material.category)}
SKU               ${material.slug.toUpperCase()}
ISSUED            ${new Date().toISOString().slice(0, 10)}

${"-".repeat(64)}
PRICING
${"-".repeat(64)}
Showroom price    ${formatPeso(material.pricePhp)} per ${material.unit}
Rate per sq ft    ${
    material.coverageSqft > 0
      ? `${formatPesoRate(pesoPerSqft(material.pricePhp, material.coverageSqft))} (covers ${material.coverageSqft} sq ft)`
      : "n/a — priced per length"
  }
Currency          Philippine Peso (PHP)
Lead time         ${material.leadTime}
Availability      ${level?.label ?? "Contact showroom"}${level ? ` (${level.onHand} pcs on hand)` : ""}
Stock checked     ${stock.checkedAt}

${"-".repeat(64)}
TECHNICAL SPECIFICATIONS
${"-".repeat(64)}
Dimensions        ${material.specs.dimensions}
Composition       ${material.specs.composition}
Installation      ${material.specs.installation}
Fire rating       ${material.specs.fireRating}
Acoustic          ${material.specs.acoustic}
Maintenance       ${material.specs.maintenance}
Sustainable core  ${material.sustainable ? "Yes" : "No"}

${"-".repeat(64)}
DESCRIPTION
${"-".repeat(64)}
${material.description.replace(/(.{1,64})(\s|$)/g, "$1\n").trim()}

${"-".repeat(64)}
SUGGESTED PAIRINGS
${"-".repeat(64)}
${material.pairings
  .map((s) => getMaterial(s))
  .filter(Boolean)
  .map((m) => `- ${m!.name} (${m!.finish})`)
  .join("\n")}

${"-".repeat(64)}
CONTACT
${"-".repeat(64)}
${site.showroom.line1}
${site.showroom.line2}
${site.phone} · ${site.email}
${site.hours.weekdays}

CAD blocks (DWG/DXF) are issued with the measured quotation.
${rule}
`;

  return new NextResponse(sheet, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="decoforge-${material.slug}-spec.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
