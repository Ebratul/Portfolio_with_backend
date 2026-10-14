import { prisma } from "../lib/prisma";

export const statsService = {
  async get() {
    const [projects, publishedProjects, skills, timelineItems, messages, unreadMessages, recentMessages] =
      await prisma.$transaction([
        prisma.project.count(),
        prisma.project.count({ where: { status: "PUBLISHED" } }),
        prisma.skill.count(),
        prisma.timelineItem.count(),
        prisma.contactMessage.count(),
        prisma.contactMessage.count({ where: { isRead: false } }),
        prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      ]);
    return {
      projects,
      publishedProjects,
      skills,
      timelineItems,
      messages,
      unreadMessages,
      recentMessages,
    };
  },
};
