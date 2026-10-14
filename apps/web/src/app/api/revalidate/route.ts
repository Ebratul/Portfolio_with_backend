import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "../../../../env";

const bodySchema = z.object({
  secret: z.string().min(1),
  tags: z.array(z.string().min(1).max(100)).min(1).max(50),
});

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Called by the API after every admin mutation so the public site updates instantly. */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !safeEqual(parsed.data.secret, env.REVALIDATE_SECRET)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  for (const tag of parsed.data.tags) revalidateTag(tag);
  return NextResponse.json({ success: true, revalidated: parsed.data.tags });
}
