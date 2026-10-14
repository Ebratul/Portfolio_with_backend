import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../src/env";

const prisma = new PrismaClient();

/** Seeded assets are placeholders, not Cloudinary uploads: their publicId starts with this prefix. */
const SEED_PREFIX = "seed/";
const img = (w: number, h: number, text: string) =>
  `https://placehold.co/${w}x${h}/111827/FF4D6D/png?text=${encodeURIComponent(text)}`;

async function seedAdmin(): Promise<void> {
  if (!env.ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD must be set to run the seed (it creates the admin user).");
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { passwordHash, role: "ADMIN", refreshToken: null },
    create: { email: env.ADMIN_EMAIL, passwordHash, role: "ADMIN" },
  });
}

async function seedSettings(): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      seoTitle: "Alex Morgan — Full-Stack Developer",
      seoDescription:
        "Portfolio of Alex Morgan, a full-stack developer building fast, accessible and well-architected web applications.",
      seoKeywords: ["full-stack developer", "react", "next.js", "node.js", "portfolio"],
      footerText: "Crafting reliable software with care.",
    },
  });
}

async function seedSections(): Promise<void> {
  const sections = [
    { key: "hero", title: "Home", subtitle: null },
    { key: "about", title: "Who am I", subtitle: "A little about me and what drives my work" },
    { key: "skills", title: "Technical Arsenal", subtitle: "Tools and technologies I work with" },
    { key: "projects", title: "Featured Projects", subtitle: "A selection of things I have built" },
    { key: "journey", title: "Technical Journey", subtitle: "Experience, education and certifications" },
    { key: "contact", title: "Get In Touch", subtitle: "Have a project in mind? Let's talk" },
    { key: "activity", title: "Coding Activity", subtitle: "My contributions on GitHub" },
  ];
  for (const [order, s] of sections.entries()) {
    await prisma.sectionConfig.upsert({
      where: { key: s.key },
      update: {},
      create: { ...s, order, isVisible: true },
    });
  }
}

async function seedProfile(): Promise<void> {
  await prisma.profile.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      fullName: "Alex Morgan",
      brandName: "alexmorgan",
      brandSuffix: ".dev",
      badgeText: "Digital Architect",
      roles: ["Full-Stack Developer", "Problem Solver", "Open Source Enthusiast"],
      tagline: "I build scalable, accessible web products from database to pixel.",
      shortBio:
        "Full-stack developer focused on TypeScript, clean architecture and delightful user experiences.",
      aboutHeading: "I craft digital solutions that are fast, reliable and beautiful",
      aboutHighlights: ["fast", "reliable", "beautiful"],
      aboutParagraphs: [
        "I am a developer who enjoys turning complex problems into simple, maintainable software. My work spans APIs, databases, and polished front-end interfaces.",
        "I care about performance, accessibility and developer experience, and I like shipping small improvements continuously.",
      ],
      avatarUrl: img(600, 600, "Avatar"),
      avatarPublicId: `${SEED_PREFIX}avatar`,
      aboutImageUrl: img(600, 600, "About"),
      aboutImagePublicId: `${SEED_PREFIX}about`,
      experienceYears: 3,
      isAvailable: true,
      availabilityText: "Available",
      location: "Dhaka, Bangladesh",
      email: "hello@example.com",
      phone: "+880 1700 000000",
      whatsapp: "+8801700000000",
      githubUsername: "octocat",
    },
  });
}

async function seedLists(): Promise<void> {
  if ((await prisma.valueCard.count()) === 0) {
    await prisma.valueCard.createMany({
      data: [
        { title: "Problem Solving", icon: "Lightbulb", order: 0 },
        { title: "Clean Code", icon: "CodeXml", order: 1 },
        { title: "Fast Delivery", icon: "Rocket", order: 2 },
      ],
    });
  }

  if ((await prisma.socialLink.count()) === 0) {
    await prisma.socialLink.createMany({
      data: [
        { platform: "github", url: "https://github.com/octocat", icon: "Github", order: 0 },
        { platform: "linkedin", url: "https://linkedin.com/in/example", icon: "Linkedin", order: 1 },
        { platform: "x", url: "https://x.com/example", icon: "Twitter", order: 2 },
      ],
    });
  }

  if ((await prisma.skill.count()) === 0) {
    type S = [string, "LANGUAGES" | "FRONTEND" | "BACKEND" | "DATABASE" | "TOOLS", "LEARNING" | "INTERMEDIATE" | "PRO", number, string, string];
    const skills: S[] = [
      ["TypeScript", "LANGUAGES", "PRO", 90, "SiTypescript", "#3178C6"],
      ["JavaScript", "LANGUAGES", "PRO", 92, "SiJavascript", "#F7DF1E"],
      ["Python", "LANGUAGES", "INTERMEDIATE", 70, "SiPython", "#3776AB"],
      ["React", "FRONTEND", "PRO", 90, "SiReact", "#61DAFB"],
      ["Next.js", "FRONTEND", "PRO", 88, "SiNextdotjs", "#FFFFFF"],
      ["Tailwind CSS", "FRONTEND", "PRO", 92, "SiTailwindcss", "#06B6D4"],
      ["Node.js", "BACKEND", "PRO", 88, "SiNodedotjs", "#5FA04E"],
      ["Express", "BACKEND", "PRO", 86, "SiExpress", "#FFFFFF"],
      ["PostgreSQL", "DATABASE", "INTERMEDIATE", 78, "SiPostgresql", "#4169E1"],
      ["MongoDB", "DATABASE", "INTERMEDIATE", 75, "SiMongodb", "#47A248"],
      ["Prisma", "DATABASE", "PRO", 85, "SiPrisma", "#2D3748"],
      ["Git", "TOOLS", "PRO", 90, "SiGit", "#F05032"],
      ["Docker", "TOOLS", "LEARNING", 55, "SiDocker", "#2496ED"],
      ["Vercel", "TOOLS", "INTERMEDIATE", 80, "SiVercel", "#FFFFFF"],
    ];
    const counters: Record<string, number> = {};
    await prisma.skill.createMany({
      data: skills.map(([name, category, level, percentage, icon, iconColor]) => ({
        name,
        category,
        level,
        percentage,
        icon,
        iconColor,
        order: (counters[category] = (counters[category] ?? -1) + 1),
      })),
    });
  }

  if ((await prisma.timelineItem.count()) === 0) {
    await prisma.timelineItem.createMany({
      data: [
        {
          type: "EXPERIENCE",
          title: "Full-Stack Developer",
          organization: "Acme Software Ltd.",
          location: "Dhaka, Bangladesh",
          startDate: new Date("2023-01-01"),
          endDate: null,
          description:
            "Built and maintained customer-facing web applications and REST APIs, improving page performance and test coverage.",
          tags: ["TypeScript", "Next.js", "Node.js", "PostgreSQL"],
          order: 0,
        },
        {
          type: "EXPERIENCE",
          title: "Junior Web Developer",
          organization: "Pixel Studio",
          location: "Remote",
          startDate: new Date("2021-06-01"),
          endDate: new Date("2022-12-31"),
          description: "Delivered responsive marketing sites and internal dashboards for small businesses.",
          tags: ["React", "Tailwind CSS"],
          order: 1,
        },
        {
          type: "EDUCATION",
          title: "B.Sc. in Computer Science",
          organization: "Example University",
          location: "Dhaka, Bangladesh",
          startDate: new Date("2017-01-01"),
          endDate: new Date("2021-01-01"),
          description: "Focused on algorithms, databases and software engineering.",
          tags: ["Algorithms", "Databases"],
          order: 0,
        },
        {
          type: "CERTIFICATE",
          title: "Front-End Developer Certificate",
          organization: "Example Academy",
          startDate: new Date("2022-03-01"),
          endDate: new Date("2022-03-01"),
          description: "Professional certificate covering modern HTML, CSS, JavaScript and React.",
          tags: ["React", "JavaScript"],
          credentialUrl: "https://example.com/credential/123",
          imageUrl: img(640, 420, "Certificate"),
          imagePublicId: `${SEED_PREFIX}certificate-1`,
          order: 0,
        },
      ],
    });
  }

  if ((await prisma.project.count()) === 0) {
    const projects = [
      {
        slug: "taskflow",
        title: "TaskFlow",
        subtitle: "Full-Stack Team Task Management App",
        summary: "A collaborative kanban board with real-time updates, roles and activity history.",
        techStack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"],
        featured: true,
      },
      {
        slug: "shopline",
        title: "ShopLine",
        subtitle: "E-Commerce Storefront and Admin",
        summary: "A performant storefront with cart, checkout and an inventory admin panel.",
        techStack: ["React", "Node.js", "Express", "MongoDB"],
        featured: true,
      },
      {
        slug: "devblog",
        title: "DevBlog",
        subtitle: "Markdown-Driven Publishing Platform",
        summary: "A fast blog engine with markdown authoring, tags and full-text search.",
        techStack: ["Next.js", "Tailwind CSS", "PostgreSQL"],
        featured: true,
      },
    ];
    for (const [order, p] of projects.entries()) {
      await prisma.project.create({
        data: {
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          summary: p.summary,
          description: `<p>${p.summary} This is placeholder content — edit it from the admin dashboard.</p>`,
          features: ["Authentication and roles", "Responsive UI", "REST API with validation", "Automated tests"],
          architecture: "A Next.js front end talks to an Express API backed by PostgreSQL via Prisma.",
          techStack: p.techStack,
          role: "Full-Stack Developer",
          coverUrl: img(1280, 720, p.title),
          coverPublicId: `${SEED_PREFIX}${p.slug}-cover`,
          liveUrl: "https://example.com",
          githubUrl: "https://github.com/octocat/Hello-World",
          isFeatured: p.featured,
          status: "PUBLISHED",
          order,
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-04-01"),
          images: {
            create: [1, 2].map((n) => ({
              url: img(1280, 720, `${p.title} ${n}`),
              publicId: `${SEED_PREFIX}${p.slug}-${n}`,
              alt: `${p.title} screenshot ${n}`,
              order: n - 1,
            })),
          },
        },
      });
    }
  }
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedSettings();
  await seedSections();
  await seedProfile();
  await seedLists();
  console.log(`Seed complete. Admin: ${env.ADMIN_EMAIL}`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
