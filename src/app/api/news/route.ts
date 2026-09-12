import { NextResponse } from "next/server";
import { db } from "@/db";
import { news } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const rows = await db.select().from(news).orderBy(desc(news.id));
  return NextResponse.json({ items: rows });
}
