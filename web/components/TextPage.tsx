/** Shared layout for text pages (About, Help, Terms, Privacy). */
export function TextPage({
  title,
  intro,
  note,
  children,
}: {
  title: string;
  intro?: string;
  /** Yellow notice under the title, e.g. "Draft". */
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">{title}</h1>
      {intro && <p className="mt-3 text-lg text-subtle">{intro}</p>}
      {note && <p className="mt-4 rounded-lg border border-sun/50 bg-sun/10 px-4 py-3 text-sm text-ink">{note}</p>}
      <div className="mt-8 space-y-4 leading-relaxed text-ink [&_a]:font-semibold [&_a]:text-primary [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
        {children}
      </div>
    </main>
  );
}
