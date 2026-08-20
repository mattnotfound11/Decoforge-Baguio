import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Sustainability",
  description: "How Decoforge sources material, handles offcuts, and reports the content of what we supply.",
};

export default function SustainabilityPage() {
  return (
    <ProsePage
      title="Sustainability"
      updated="1 January 2024"
      intro="What we actually do about material sourcing and waste — stated plainly, without claims we cannot evidence."
      sections={[
        {
          heading: "Reclaimed content",
          body: [
            "Our WPC panels and decking are built on a core of roughly 60% reclaimed hardwood fibre, sourced as mill residue rather than from newly felled timber. The percentage is stated on every specification sheet, and it is a floor rather than an average.",
            "Products carrying the Sustainable Core marker on this site meet that threshold. Products without it do not, and we would rather say so than blur the line.",
          ],
        },
        {
          heading: "Offcuts and site waste",
          body: [
            "Panel offcuts longer than 400 mm are kept and reused on smaller jobs — infill panels, trim runs, and sample boards. Shorter offcuts go back to our supplier's regrind stream on the return leg of each container.",
            "We remove our own site waste at the end of every installation. It does not become the client's problem or the building's skip.",
          ],
        },
        {
          heading: "Longevity as the real measure",
          body: [
            "The most significant thing we can do is supply a surface that does not need replacing. Colour is run through the full thickness of our boards rather than printed on the face, so a scratch does not force a swap.",
            "The five-year workmanship guarantee exists for the same reason: a repaired wall has a far smaller footprint than a replaced one.",
          ],
        },
        {
          heading: "What we do not claim",
          body: [
            "We are not carbon neutral and we do not buy offsets to say that we are. Our material is imported, which carries freight emissions we have not eliminated. We would rather report that honestly than market around it.",
          ],
        },
      ]}
    />
  );
}
