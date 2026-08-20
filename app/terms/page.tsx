import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply to quotations, orders, and installation work carried out by Decoforge.",
};

export default function TermsPage() {
  return (
    <ProsePage
      title="Terms of Service"
      updated="1 January 2024"
      intro={`The terms that apply when you request a quotation from ${site.legalName} or engage us to supply and install architectural surfaces.`}
      sections={[
        {
          heading: "Quotations and pricing",
          body: [
            "Catalog prices are indicative and quoted per piece for the standard size and finish. They exclude delivery, installation, and any site preparation.",
            "A written quotation is valid for thirty days from its issue date. Custom dimensions, non-standard finishes, and delivery outside Benguet are priced individually in that quotation.",
          ],
        },
        {
          heading: "Stock availability",
          body: [
            "Availability shown on this site reflects showroom stock at the time the page was loaded. Stock is not held or reserved until a quotation is accepted and a deposit is received.",
          ],
        },
        {
          heading: "Appointments",
          body: [
            "Booking a consultation or site visit reserves a slot with our team. It does not create an order and carries no cost. If you need to move or cancel, reply to your confirmation email with your reference.",
          ],
        },
        {
          heading: "Orders and payment",
          body: [
            "Orders are confirmed on acceptance of a written quotation and receipt of the stated deposit. The balance falls due on completion of installation unless the quotation says otherwise.",
          ],
        },
        {
          heading: "Workmanship",
          body: [
            "Any workmanship guarantee is stated on your written quotation. Where one applies and a fault arising from our work appears within that period, we return and repair it at our cost.",
            "The guarantee does not cover damage from impact, unapproved modification, water ingress originating outside our scope, or normal wear.",
          ],
        },
        {
          heading: "Governing law",
          body: [
            "These terms are governed by the laws of the Republic of the Philippines. Disputes fall to the courts of Baguio City, Benguet.",
          ],
        },
      ]}
    />
  );
}
