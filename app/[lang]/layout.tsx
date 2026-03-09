export function generateStaticParams() {
  return [{ lang: "de" }, { lang: "fr" }, { lang: "en" }];
}

export default function LangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
