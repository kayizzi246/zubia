import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Inter: body text, forms, tables, buttons, labels.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Manrope: headings, navigation, hero text, prices, UI titles.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Zubia: homes and land in Uganda",
  description:
    "Buy, rent or find land across Kampala, Wakiso, Entebbe and Mukono.",
};

// The public site's header and footer live in app/(site)/layout.tsx,
// and the admin has its own layout in app/admin.
export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
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
