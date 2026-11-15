import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin | Zubia", template: "%s | Zubia admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-svh flex-col bg-surface">{children}</div>;
}
