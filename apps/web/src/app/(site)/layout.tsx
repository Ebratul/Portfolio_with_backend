import type { ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { getHome } from "@/lib/api";
import { NAV_LABELS, navSections } from "@/lib/site";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { profile, settings, socials, sections } = await getHome();
  return (
    <>
      <Navbar
        brandName={profile.brandName}
        brandSuffix={profile.brandSuffix}
        items={navSections(sections).map((s) => ({ key: s.key, label: NAV_LABELS[s.key] }))}
      />
      <main id="main">{children}</main>
      <Footer profile={profile} settings={settings} socials={socials} sections={sections} />
    </>
  );
}
