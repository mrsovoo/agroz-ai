import { createHmac } from "crypto";

/**
 * Telegram WebApp initData imzosini tekshiradi.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secret).update(dataCheckString).digest("hex");
  // compare in constant time to avoid timing attacks
  const a = Buffer.from(computed);
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return createHmac("sha256", secret).update(dataCheckString).digest("hex") === hash;
}
