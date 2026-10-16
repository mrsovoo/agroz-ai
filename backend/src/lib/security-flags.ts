/**
 * Production xavfsizlik himoyalari:
 * NODE_ENV === "production" bo'lganda quyidagi noxavfsiz sozlamalar KOD DARAJASIDA MAJBURAN false qilinadi:
 * 1. SEED_DEMO_DATA - production bazaga demo/mock yozuvlarni kiritishni qat'iy taqiqlaydi.
 * 2. ALLOW_UNVERIFIED_TELEGRAM - production'da Telegram imzosi (initData hash) tekshirilmagan
 *    so'rovlar orqali tizimga kirishni yoki sessiya olishni qat'iy taqiqlaydi.
 */

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

