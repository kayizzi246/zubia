import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Inter: body text, forms, tables, buttons, labels.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Poppins: the Zubia wordmark, headings, navigation, hero text, prices.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Zubia: homes and land in Uganda",
  description:
    "Buy, rent or find land across Kampala, Wakiso, Entebbe and Mukono.",
  applicationName: "Zubia",
  // app/icon.svg, app/apple-icon.png and app/opengraph-image.png are picked
  // up automatically by the file conventions; this sets the sharing text.
  openGraph: {
    title: "Zubia: homes and land in Uganda",
    description:
      "Buy, rent or find land across Kampala, Wakiso, Entebbe and Mukono.",
    siteName: "Zubia",
    type: "website",
  },
};

// The public site's header and footer live in app/(site)/layout.tsx,
// and the admin has its own layout in app/admin.
export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
        {/* Listing pop-up (app/@modal), shown over whatever page is open. */}
        {modal}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
