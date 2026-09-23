"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onTelegramReady, getTelegram } from "@/lib/telegram";
import { apiUrl } from "@/lib/api-config";
import { Sprout, Send, Loader2, UserCheck, ShieldAlert } from "lucide-react";

export default function ProfileTelegramAutoAuth() {
  const router = useRouter();
  const [isTg, setIsTg] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notRegistered, setNotRegistered] = useState(false);
  const [botUsername, setBotUsername] = useState("agroz_ai_bot");

  useEffect(() => {
    let unmounted = false;

    const stop = onTelegramReady((tg) => {
      if (unmounted) return;
      setIsTg(true);

      if (tg.initData) {
        (async () => {
          try {
            const res = await fetch(apiUrl("/api/auth/telegram"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ initData: tg.initData }),
            });
            const data = await res.json();

            if (data.ok && data.sessionId && data.registered) {
              document.cookie = `agroai_session=${data.sessionId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
              router.refresh();
              return;
            }

            if (data.registered === false) {
              setNotRegistered(true);
            }
          } catch (err) {
            console.warn("[ProfileTelegramAutoAuth] tekshirish xatosi:", err);
          } finally {
            if (!unmounted) setChecking(false);
          }
        })();
      } else {
        if (!unmounted) setChecking(false);
      }
    });

    // Telegram bo'lmagan oddiy brauzerda 600ms dan keyin tekshiruvni to'xtatish
    const timeout = setTimeout(() => {
      if (!unmounted && !getTelegram()?.initData) {
        setChecking(false);
      }
    }, 600);

    return () => {
      unmounted = true;
      stop();
      clearTimeout(timeout);
    };
  }, [router]);

  if (checking) {
    return (
      <main className="px-5 pb-6 pt-3">
        <p className="ios-sub">Profil</p>
        <h1 className="ios-title">Profil</h1>
        <div className="ios-card mt-6 flex flex-col items-center justify-center gap-3 p-10 text-center">
          <Loader2 className="animate-spin text-[var(--brand-green)]" size={36} />
          <p className="text-[15px] font-semibold text-slate-700">
            Profilingiz ma&apos;lumotlari tekshirilmoqda...
          </p>
          <p className="text-xs text-slate-400">Telegram hisobingiz bilan avtomatik ulanmoqda</p>
        </div>
      </main>
    );
  }

  if (isTg && notRegistered) {
    return (
      <main className="px-5 pb-6 pt-3">
        <p className="ios-sub">Profil</p>
        <h1 className="ios-title">Ro&apos;yxatdan o&apos;tish</h1>
        <div className="ios-card mt-6 flex flex-col items-center gap-4 p-6 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[22px] text-amber-800"
            style={{ background: "#FEF3C7" }}
          >
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-[17px] font-extrabold text-slate-900">
            Botda hali ro&apos;yxatdan o&apos;tmadingiz
          </h2>
          <p className="text-[14px] leading-relaxed text-slate-600">
            Platformadan to&apos;liq foydalanish va dorilarga buyurtma berish uchun avval botimizda ism va telefon raqamingizni tasdiqlang.
          </p>
          <div className="w-full max-w-sm space-y-2.5 pt-2">
            <Link href="/kirish" className="block w-full">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-extrabold text-white shadow-md hover:brightness-105 active:scale-95 transition"
                style={{ background: "#028e11" }}
              >
                <UserCheck size={18} />
                <span>Ro&apos;yxatdan o&apos;tish / Kirish</span>
              </button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 pb-6 pt-3">
      <p className="ios-sub">Profil</p>
      <h1 className="ios-title">Kirish</h1>
      <div className="ios-card mt-6 flex flex-col items-center gap-4 p-6 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-[22px] text-[var(--brand-ink)]"
          style={{ background: "var(--brand-yellow)" }}
        >
          <Sprout size={32} />
        </div>
        <p className="text-[15px] leading-relaxed text-[var(--brand-ink)]">
          Yaqin dorixonalarni ko&apos;rish, mutaxassislar bilan bog&apos;lanish va savatingizni boshqarish uchun profilingizga kiring.
        </p>
        <div className="w-full max-w-sm space-y-2.5 pt-2">
          <Link href="/kirish" className="block w-full">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-extrabold text-white shadow-md hover:brightness-105 active:scale-95 transition"
              style={{ background: "#2AABEE" }}
            >
              <Send size={18} />
              <span>Telegram orqali 1 bosishda kirish</span>
            </button>
          </Link>
          <Link href="/kirish" className="block text-[13px] font-bold text-[var(--brand-green)] hover:underline">
            Yoki telefon raqam bilan kirish →
          </Link>
        </div>
      </div>
    </main>
  );
}
