import { AppRail } from "@/components/search/AppRail";

// Full-screen, app-like layout for the map search: an icon rail on the left
// (a top bar on phones) and no site header or footer.
export default function ExploreLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <AppRail />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
