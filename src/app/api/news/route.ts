import { NextResponse } from "next/server";
import { db } from "@/db";
import { news } from "@/db/schema";
import { desc } from "drizzle-orm";import { ensureSeed } from "@/lib/seed";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = withApiErrors(async () => {
  await ensureSeed();
  const rows = await db.select().from(news).orderBy(desc(news.id));
  return NextResponse.json(
    { items: rows },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } },
  );
});
