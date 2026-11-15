import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/TextPage";

export const metadata: Metadata = { title: "Terms of use | Zubia" };

// TODO(owner): have a Ugandan lawyer review and complete these terms before launch.
export default function TermsPage() {
  return (
    <TextPage
      title="Terms of use"
      note="Draft for review. These terms are a starting point and must be checked by a lawyer before Zubia launches."
    >
      <h2>1. About these terms</h2>
      <p>
        These terms apply when you use the Zubia website and app. By using Zubia you agree to them. If you don&apos;t
        agree, please don&apos;t use Zubia.
      </p>

      <h2>2. What Zubia does</h2>
      <p>
        Zubia is a platform where owners, brokers, agencies and developers advertise property. Zubia is not a party to
        any sale or rental agreement, does not own the listed properties, and does not hold money on behalf of buyers,
        sellers, landlords or tenants.
      </p>

      <h2>3. Listings</h2>
      <ul>
        <li>People who list a property are responsible for its accuracy, including price, photos, size and tenure.</li>
        <li>You may only list property you own or are authorised to market.</li>
        <li>Zubia may edit, hide or remove any listing, for example if it looks misleading or fraudulent.</li>
      </ul>

      <h2>4. Title checks</h2>
      <p>
        A &quot;Title checked&quot; badge means Zubia searched the title at the land registry and the details matched
        the listing on the date of the search. It is not a guarantee of ownership or of the absence of disputes. Buyers
        should carry out their own checks and use a lawyer.
      </p>

      <h2>5. Payments to Zubia</h2>
      <p>
        Fees for listing plans and extras are shown on the <Link href="/pricing">pricing page</Link>. [Refund and
        renewal rules to be added.]
      </p>

      <h2>6. Acceptable use</h2>
      <ul>
        <li>No fake listings, bait prices, or requests for payment before a viewing.</li>
        <li>No copying listings or photos from other people without permission.</li>
        <li>No harassment of other users.</li>
      </ul>

      <h2>7. Liability</h2>
      <p>[To be completed by a lawyer, in line with Ugandan law.]</p>

      <h2>8. Contact</h2>
      <p>
        Questions about these terms? <Link href="/contact">Contact us</Link>.
      </p>
    </TextPage>
  );
}
