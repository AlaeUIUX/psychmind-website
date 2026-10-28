// A blog post, read on its own (components/blog/reader.tsx): the public site's type and
// buttons, as (site)/layout.tsx, without its header, footer or smooth scrolling (the post
// snaps from part to part, which a smooth scroll would fight).
export default function ReaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="type-scope-sort site-ui contents">
      <main className="flex-1">{children}</main>
    </div>
  );
}
