import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { preconnect } from "react-dom";
import { env } from "../../env";
import { Providers } from "@/components/site/Providers";
import { getHome } from "@/lib/api";
import { onColor } from "@/lib/color";
import { fontClassNames, fontVar } from "@/lib/fonts";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { settings, profile } = await getHome();
    const og = settings.ogImageUrl ? [{ url: settings.ogImageUrl, width: 1200, height: 630 }] : [];
    return {
      metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
      title: { default: settings.seoTitle, template: `%s | ${profile.fullName}` },
      description: settings.seoDescription,
      keywords: settings.seoKeywords,
      authors: [{ name: profile.fullName }],
      alternates: { canonical: "/" },
      icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
      openGraph: {
        type: "website",
        title: settings.seoTitle,
        description: settings.seoDescription,
        siteName: profile.fullName,
        images: og,
      },
      twitter: {
        card: "summary_large_image",
        title: settings.seoTitle,
        description: settings.seoDescription,
        images: og.map((i) => i.url),
      },
    };
  } catch {
    return { metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL), title: "Portfolio" };
  }
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const FALLBACK = {
  primaryColor: "#FF4D6D",
  accentColor: "#E94584",
  bgColor: "#0A0E1A",
  surfaceColor: "#111827",
  defaultTheme: "dark",
  fontHeading: "Outfit",
  fontBody: "Inter",
} as const;

/** Runs before first paint: restores the visitor's palette choice without a flash. */
const paletteScript = `try{var a=JSON.parse(localStorage.getItem("accent")||"null");if(a&&/^#[0-9a-f]{6}$/i.test(a.primary)&&/^#[0-9a-f]{6}$/i.test(a.accent)){var s=document.documentElement.style;s.setProperty("--primary",a.primary);s.setProperty("--accent",a.accent);s.setProperty("--on-primary",a.on)}}catch(e){}`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Images are served from Cloudinary; opening the connection early shortens every image's load.
  preconnect("https://res.cloudinary.com");
  const settings = await getHome()
    .then((h) => h.settings)
    .catch(() => FALLBACK);

  // Brand colours come straight from the CMS; derived text colours keep contrast AA.
  const tokens = `
:root{--primary:${settings.primaryColor};--accent:${settings.accentColor};--on-primary:${onColor(settings.primaryColor)};
--font-heading-stack:${fontVar(settings.fontHeading)},system-ui,sans-serif;
--font-body-stack:${fontVar(settings.fontBody)},system-ui,sans-serif}
[data-theme="dark"]{--bg:${settings.bgColor};--surface:${settings.surfaceColor}}`;

  const theme = (["dark", "light", "system"] as const).find((t) => t === settings.defaultTheme) ?? "dark";

  return (
    <html lang="en" suppressHydrationWarning className={fontClassNames}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: tokens }} />
        <script dangerouslySetInnerHTML={{ __html: paletteScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        >
          Skip to content
        </a>
        <Providers defaultTheme={theme}>{children}</Providers>
      </body>
    </html>
  );
}

