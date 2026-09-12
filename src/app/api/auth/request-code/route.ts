import { NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";

export const dynamic = "force-dynamic";

function normalize(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("998") ? `+${digits}` : `+998${digits.slice(-9)}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { phone?: string };
  const raw = body.phone ?? "";
  if (raw.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ error: "Telefon raqam noto'g'ri" }, { status: 400 });
  }
  const phone = normalize(raw);
  const code = String(Math.floor(1000 + Math.random() * 9000));
  await db.insert(otpCodes).values({
    phone,
    code,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  // MVP: SMS provayder ulanmagan, kod javobda qaytariladi
  return NextResponse.json({ ok: true, phone, devCode: code });
}
