/**
 * Production xavfsizlik himoyalari:
 * NODE_ENV === "production" bo'lganda quyidagi noxavfsiz sozlamalar KOD DARAJASIDA MAJBURAN false qilinadi:
 * 1. SEED_DEMO_DATA - production bazaga demo/mock yozuvlarni kiritishni qat'iy taqiqlaydi.
 * 2. ALLOW_UNVERIFIED_TELEGRAM - production'da Telegram imzosi (initData hash) tekshirilmagan
 *    so'rovlar orqali tizimga kirishni yoki sessiya olishni qat'iy taqiqlaydi.
 */

export const SESSION_TTL_DAYS = 30;
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export function createSessionExpiryDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + SESSION_TTL_MS);
}

export function isSeedDemoDataAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === "production") {
    return false;
  }
  return env.SEED_DEMO_DATA === "true";
}

export function isAllowUnverifiedTelegramAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === "production") {
    return false;
  }
  return env.ALLOW_UNVERIFIED_TELEGRAM === "true";
}

/**
 * BiznesGO demo kirish (production bo'lmaganda va ALLOW_PARTNER_DEMO === "true" bo'lganda).
 * Production'da qat'iy false qaytaradi.
 */
export function isPartnerDemoAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === "production") {
    return false;
  }
  return env.ALLOW_PARTNER_DEMO === "true";
}

export function evaluatePartnerAccess(params: {
  allowedRoles: Array<"farmer" | "specialist" | "pharmacy" | "both">;
  specialistRole?: string | null;
  specialistId?: number | string | null;
  requestedPartnerId?: number | string | null;
}): { allowed: boolean; status: number; error?: string } {
  const { allowedRoles, specialistRole, specialistId, requestedPartnerId } = params;
  if (!specialistRole || specialistId === undefined || specialistId === null) {
    return { allowed: false, status: 403, error: "Ushbu amal uchun ruxsat yo'q" };
  }

  const roleAllowed =
    specialistRole === "both"
      ? allowedRoles.includes("pharmacy") ||
        allowedRoles.includes("specialist") ||
        allowedRoles.includes("both")
      : allowedRoles.includes(specialistRole as any);

  if (!roleAllowed) {
    return { allowed: false, status: 403, error: "Ruxsat etilmagan rol" };
  }

  if (
    requestedPartnerId !== undefined &&
    requestedPartnerId !== null &&
    String(requestedPartnerId).trim() !== "" &&
    String(requestedPartnerId) !== String(specialistId)
  ) {
    return {
      allowed: false,
      status: 403,
      error: "Boshqa hamkorga tegishli resursga kirish taqiqlangan",
    };
  }

  return { allowed: true, status: 200 };
}



