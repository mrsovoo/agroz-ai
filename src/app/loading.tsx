/**
 * Sahifalar orasida o'tishda darhol ko'rinadigan skelet.
 * Kuchsiz internetda foydalanuvchi "qotib qoldi" degan taassurot olmasligi uchun.
 */
export default function Loading() {
  return (
    <main className="px-5 pb-6 pt-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Yuklanmoqda...</span>

      <div className="skeleton h-4 w-28 rounded-full" />
      <div className="skeleton mt-3 h-9 w-48 rounded-xl" />

      <div className="skeleton mt-5 h-[168px] rounded-[28px]" />

      <div className="mt-7 space-y-3">
        <div className="skeleton h-24 rounded-[28px]" />
        <div className="skeleton h-24 rounded-[28px]" />
        <div className="skeleton h-20 rounded-[24px]" />
      </div>
    </main>
  );
}
