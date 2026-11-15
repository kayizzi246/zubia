import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/TextPage";

export const metadata: Metadata = { title: "Privacy notice | Zubia" };

// TODO(owner): have a lawyer check this against Uganda's Data Protection and
// Privacy Act 2019, and register with the Personal Data Protection Office.
export default function PrivacyPage() {
  return (
    <TextPage
      title="Privacy notice"
      note="Draft for review. This notice must be checked against Uganda's Data Protection and Privacy Act, 2019 before launch."
    >
      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> your name, email, phone number and password (stored encrypted).</li>
        <li><b>Listings:</b> the details and photos you add, including the contact phone you choose to show.</li>
        <li><b>Messages:</b> what you send us through the contact form.</li>
        <li><b>On this device only:</b> your saved homes and saved searches, kept in your browser.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To show your listings and let people contact you about them.</li>
        <li>To reply to your messages and check reported listings.</li>
        <li>To keep Zubia safe and stop fraud.</li>
      </ul>
      <p>We don&apos;t sell your personal data.</p>

      <h2>Who we share it with</h2>
      <p>
        Our service providers, who store data for us: Supabase (database and sign-in) and our website host. Map tiles
        come from OpenStreetMap. [Payment provider to be added when payments launch.]
      </p>

      <h2 id="cookies">Cookies and local storage</h2>
      <p>
        We use a cookie to keep you signed in. Saved homes and saved searches are stored in your browser&apos;s local
        storage and never leave your device. We don&apos;t use advertising cookies. You can clear all of this in your
        browser settings at any time.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct or delete your personal data. <Link href="/contact?topic=help">Contact us</Link>{" "}
        and we&apos;ll respond within [number] days.
      </p>
    </TextPage>
  );
}
