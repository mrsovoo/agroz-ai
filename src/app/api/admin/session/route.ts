import { db } from "@/db";
import { adminSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { adminEnabled, adminLogin } from "@/lib/admin-auth";
import { clientIp } from "@/lib/validate";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Admin panelga login: {username, password}. Cookie httpOnly qilib qo'yiladi. */
export async function POST(req: Request) {
  if (!(await adminEnabled())) {
    return Response.json(
      { error: "Admin panel o'chirilgan. ADMIN_PASSWORD env o'zgaruvchisini qo'ying." },
      { status: 503 },
    );
  }

  const ip = clientIp(req);
  const limit = rateLimit(`admin:login:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  if (!body.username || !body.password) {
    return Response.json({ error: "Login va parol kerak" }, { status: 400 });
  }

  const result = await adminLogin(body.username, body.password);
  if (!result.ok) {
    if (result.error === "invalid") {
      return Response.json({ error: "Login yoki parol noto'g'ri" }, { status: 401 });
    }
    return Response.json({ error: "Admin panel o'chirilgan" }, { status: 503 });
  }
  return Response.json({ ok: true });
}

// Logout uchun ham shu route ishlatiladi (DELETE metodi).
export async function DELETE() {
  const { adminLogout } = await import("@/lib/admin-auth");
  await adminLogout();
  return Response.json({ ok: true });
}

/** Sessiyalar sonini qaytaradi (tashxis uchun). */
/** Admin hisobi holati (parol bor-yo'qligi, sessiyalar soni). */
export async function GET() {
  const rows = await db.select().from(adminSessions);
  return Response.json({ ok: true, count: rows.length });
}
