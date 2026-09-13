import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api";
import { getNewsFeed } from "@/lib/news";

export const dynamic = "force-dynamic";

/**
 * Agro va chorvachilik yangiliklari.
 *
 * Asosiy qism — real RSS manbalardan (Kun.uz, Gazeta.uz, EastFruit, Google News).
 * Bazadagi yozuvlar (admin qo'shgan bo'lsa) ro'yxat boshida turadi.
 */
export const GET = withApiErrors(async () => {
  const items = await getNewsFeed();
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } },
  );
});
