import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Decoforge collects, uses, and protects the personal information you share with us.",
};

export default function PrivacyPage() {
  return (
    <ProsePage
      title="Privacy Policy"
      updated="1 January 2024"
      intro={`How ${site.legalName} collects, uses, and protects the personal information you share when you book an appointment or request a quotation.`}
      sections={[
        {
          heading: "What we collect",
          body: [
            "We only collect what we need to quote and deliver your project. When you book a consultation or request a quotation, we ask for:",
          ],
          bullets: [
            "Your name, email address, and contact number.",
            "The appointment type, date, and time you selected.",
            "The material category you are interested in, and any project details you choose to write.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "Your details are used to confirm your appointment, prepare your quotation, and follow up on the work. We do not sell your information, and we do not add you to a marketing list unless you ask us to.",
            "Booking notifications are delivered to our team inbox through a third-party email provider. That provider processes the message in order to deliver it, and is bound by its own data-processing terms.",
          ],
        },
        {
          heading: "How long we keep it",
          body: [
            "Enquiries that do not become projects are removed from our systems after twenty-four months. Records tied to completed work are retained for the length of the workmanship guarantee plus the period required by Philippine tax and accounting rules.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "Under the Data Privacy Act of 2012 (Republic Act 10173) you may ask to see the personal information we hold about you, correct it, or have it erased. Write to us and we will respond within fifteen working days.",
          ],
        },
        {
          heading: "Contact",
          body: [
            `Questions about this policy can go to ${site.email} or ${site.phone}. Our showroom is at ${site.showroom.line1}, ${site.showroom.line2}.`,
          ],
        },
      ]}
    />
  );
}
