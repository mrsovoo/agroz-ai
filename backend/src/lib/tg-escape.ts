/** Telegram `parse_mode=HTML` uchun foydalanuvchi matnini ekranlaydi. */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
