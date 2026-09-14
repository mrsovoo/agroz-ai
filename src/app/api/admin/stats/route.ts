import { db } from "@/db";
import { botStates, diagnoses, otpCodes, specialists, specialistMedicines, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Admin panel statistikasi: foydalanuvchilar, tashxislar, botlar holati,
 * oxirgi tashxislar va boshqalar.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [
    userCount,
    specialistCount,
    pharmacyCount,
    medicineCount,
    diagnosisCount,
    aiDiagnosisCount,
    offlineDiagnosisCount,
    botStateCount,
    recentDiagnoses,
    topDiseases,
  ] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(users),
    db.select({ n: sql<number>`count(*)::int` }).from(specialists).where(sql`role = 'specialist'`),
    db.select({ n: sql<number>`count(*)::int` }).from(specialists).where(sql`role = 'pharmacy'`),
    db.select({ n: sql<number>`count(*)::int` }).from(specialistMedicines),
    db.select({ n: sql<number>`count(*)::int` }).from(diagnoses),
    db.select({ n: sql<number>`count(*)::int` }).from(diagnoses).where(sql`source = 'ai'`),
    db.select({ n: sql<number>`count(*)::int` }).from(diagnoses).where(sql`source = 'offline'`),
    db.select({ n: sql<number>`count(*)::int` }).from(botStates),
    db
      .select({
        id: diagnoses.id,
        diseaseName: diagnoses.diseaseName,
        category: diagnoses.category,
        source: diagnoses.source,
        confidence: diagnoses.confidence,
        createdAt: diagnoses.createdAt,
      })
      .from(diagnoses)
      .orderBy(desc(diagnoses.id))
      .limit(8),
    db
      .select({ disease: diagnoses.diseaseName, n: sql<number>`count(*)::int` })
      .from(diagnoses)
      .groupBy(diagnoses.diseaseName)
      .orderBy(sql`count(*) desc`)
      .limit(6),
  ]);

  // OTP statistikasi (oxirgi 24 soat).
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [otpSent, otpVerified] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(otpCodes).where(sql`created_at > ${dayAgo}`),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(otpCodes)
      .where(sql`created_at > ${dayAgo} AND used = true`),
  ]);

  return Response.json({
    ok: true,
    stats: {
      users: userCount[0]?.n ?? 0,
      specialists: specialistCount[0]?.n ?? 0,
      pharmacies: pharmacyCount[0]?.n ?? 0,
      medicines: medicineCount[0]?.n ?? 0,
      diagnoses: diagnosisCount[0]?.n ?? 0,
      aiDiagnoses: aiDiagnosisCount[0]?.n ?? 0,
      offlineDiagnoses: offlineDiagnosisCount[0]?.n ?? 0,
      activeBotSessions: botStateCount[0]?.n ?? 0,
      otpSent24h: otpSent[0]?.n ?? 0,
      otpVerified24h: otpVerified[0]?.n ?? 0,
    },
    recentDiagnoses,
    topDiseases,
  });
}
