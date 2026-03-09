import { headers } from "next/headers";
import { PathLayout } from "./path-layout";
import MobileMenu from "@/components/MobileMenu";
import {
  inter,
  lora,
  merriweather,
  bangers,
  petitFormalScript,
  spectral,
} from "./fonts";
import type { Lang } from "@/lib/translations";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const lang = (headersList.get("x-lang") as Lang) ?? "de";

  return (
    <html lang={lang}>
      <head>
        <link
          rel="stylesheet"
          href="/css/style-desktop.css"
          media="screen and (min-width:1025px)"
        />
        <link
          rel="stylesheet"
          href="/css/style-mobile.css"
          media="screen and (max-width:768px)"
        />
        <link
          rel="stylesheet"
          href="/css/style-tablet.css"
          media="screen and (min-width:769px) and (max-width:1024px)"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, user-scalable=yes, minimum-scale=1.0, maximum-scale=5.0"
        />
      </head>
      <body
        className={`
          ${inter.variable}
          ${lora.variable}
          ${merriweather.variable}
          ${bangers.variable}
          ${petitFormalScript.variable}
          ${spectral.variable}
        `}
      >
        <MobileMenu />
        <PathLayout>{children}</PathLayout>
      </body>
    </html>
  );
}
