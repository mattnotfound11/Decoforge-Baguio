import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles and how hiring works at Decoforge in Baguio City.",
};

export default function CareersPage() {
  return (
    <ProsePage
      title="Careers"
      updated="1 January 2024"
      intro="We are a small team in Irisan, Baguio City. When we hire, it is because the work is there — not to build a headcount."
      sections={[
        {
          heading: "How we work",
          body: [
            "Everyone works on real jobs. Installers, finishers, and estimators all spend time on site rather than behind a desk.",
            "We do not subcontract installation. The person who measures your job is usually the person who fits it, which is how we keep the finish consistent.",
          ],
        },
        {
          heading: "Open roles",
          body: [
            "We are currently taking applications for the following. If nothing here fits but you think you should be working with us, write anyway — we keep good applications on file and revisit them when work comes in.",
          ],
          bullets: [
            "Installation carpenter — two years' fit-out experience, comfortable working at height, own hand tools.",
            "Estimator / draughtsperson — AutoCAD or SketchUp, able to take a site measure and produce an itemised quotation.",
            "Showroom coordinator — front of house at Irisan Road, handling bookings, samples, and client follow-up.",
          ],
        },
        {
          heading: "How to apply",
          body: [
            `Send a short note about what you have built to ${site.email}, with the role in the subject line. A few photographs of finished work are worth more to us than a formatted CV.`,
            "We reply to every application, including the ones we turn down. Expect to hear back within two weeks.",
          ],
        },
      ]}
    />
  );
}
