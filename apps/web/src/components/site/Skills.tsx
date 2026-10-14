import type { GroupedSkills, SectionConfig, SkillCategory } from "@portfolio/shared";
import { SkillIcon } from "./icons";
import { SectionHeader } from "./SectionHeader";
import { SkillsTabs, type SkillCardData, type SkillTab } from "./SkillsTabs";

const TAB_LABELS: Record<SkillCategory, string> = {
  LANGUAGES: "LANGUAGES",
  FRONTEND: "FRONTEND",
  BACKEND: "BACKEND",
  DATABASE: "DATABASE",
  TOOLS: "TOOLS & OTHERS",
};

export function Skills({ section, skills }: { section: SectionConfig; skills: GroupedSkills }) {
  // Icons are resolved here (server) so the huge icon set never ships to the browser.
  const tabs: SkillTab[] = (Object.keys(TAB_LABELS) as SkillCategory[]).map((key) => ({
    key,
    label: TAB_LABELS[key],
    skills: skills[key].map<SkillCardData>((s) => ({
      id: s.id,
      name: s.name,
      level: s.level,
      percentage: s.percentage,
      icon: <SkillIcon name={s.icon} color={s.iconColor} className="size-6" />,
      watermark: <SkillIcon name={s.icon} color={s.iconColor} className="size-full" />,
    })),
  }));

  return (
    <section id="skills" aria-labelledby="skills-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div id="skills-title">
          <SectionHeader title={section.title} subtitle={section.subtitle} />
        </div>
        <SkillsTabs tabs={tabs} />
      </div>
    </section>
  );
}
