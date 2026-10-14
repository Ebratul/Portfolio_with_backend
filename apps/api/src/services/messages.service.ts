import type { Prisma } from "@prisma/client";
import type { ContactInput } from "@portfolio/shared";
import { ApiError } from "../lib/errors";
import { notifyContact } from "../lib/mailer";
import { prisma } from "../lib/prisma";
import { env } from "../env";

export interface MessageQuery {
  page: number;
  pageSize: number;
  isRead?: boolean | undefined;
}

export const messagesService = {
  async submit(input: ContactInput, ip: string | undefined) {
    const message = await prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        ip: ip ?? null,
      },
    });
    const profile = await prisma.profile.findUnique({ where: { id: "singleton" } });
    notifyContact({ to: profile?.email ?? env.ADMIN_EMAIL, ...input });
    return { id: message.id };
  },

  async list({ page, pageSize, isRead }: MessageQuery) {
    const where: Prisma.ContactMessageWhereInput = isRead === undefined ? {} : { isRead };
    const [items, total] = await prisma.$transaction([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contactMessage.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },

  setRead: (id: string, isRead: boolean) =>
    prisma.contactMessage.update({ where: { id }, data: { isRead } }),

  async remove(id: string) {
    await prisma.contactMessage.delete({ where: { id } });
  },

  async bulk(ids: string[], action: "read" | "unread" | "delete") {
    const where = { id: { in: ids } };
    const result =
      action === "delete"
        ? await prisma.contactMessage.deleteMany({ where })
        : await prisma.contactMessage.updateMany({ where, data: { isRead: action === "read" } });
    if (result.count === 0) throw ApiError.notFound("No matching messages");
    return { count: result.count };
  },
};
