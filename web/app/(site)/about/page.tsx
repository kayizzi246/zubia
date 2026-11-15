import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/TextPage";

export const metadata: Metadata = { title: "About Zubia" };

// TODO(owner): replace with your own story, team and company details.
export default function AboutPage() {
  return (
    <TextPage
      title="About Zubia"
      intro="Zubia helps people in Uganda find homes, rentals and land, and know what they are buying before they pay."
    >
      <h2>Why we built it</h2>
      <p>
        Finding property in Uganda often means scrolling through social media posts, calling brokers who don&apos;t
        answer, and wondering whether a title is genuine. Zubia puts listings in one place, with clear prices in UGX,
        real photos, and the tenure on every listing.
      </p>

      <h2>What makes Zubia different</h2>
      <ul>
        <li>
          <b>Tenure on every listing.</b> Mailo, freehold, leasehold, kibanja or condominium, so you know how the land
          is held.
        </li>
        <li>
          <b>Title checks.</b> Listings with a &quot;Title checked&quot; badge have had their title searched at the
          land registry.
        </li>
        <li>
          <b>Contact sellers directly.</b> WhatsApp or call the owner or agent from the listing.
        </li>
        <li>
          <b>Made for phones.</b> Fast on slow connections and small screens.
        </li>
      </ul>

      <h2>Work with us</h2>
      <p>
        Agents, agencies and developers can list with us. See <Link href="/pricing">our plans</Link> or{" "}
        <Link href="/contact?topic=plans">get in touch</Link>.
      </p>
    </TextPage>
  );
}
