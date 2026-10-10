import type { TelegramUser } from "./telegram";

export function parseInitData(initData: string): Record<string, string> {
  if (!initData) return {};
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

export function parseInitDataUser(initData: string): TelegramUser | null {
  try {
    const parsed = parseInitData(initData);
    if (!parsed.user) return null;
    return JSON.parse(parsed.user) as TelegramUser;
  } catch {
    return null;
  }
}
