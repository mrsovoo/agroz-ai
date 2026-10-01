"use client";

import { useEffect, useState } from "react";
import { Smartphone, X, PlusCircle, CheckCircle2, MoreVertical } from "lucide-react";
import {
  getTelegram,
  onTelegramReady,
  canAddToHomeScreen,
  checkTelegramHomeScreenStatus,
  promptAddToHomeScreen,
  haptic,
} from "@/lib/telegram";

const DISMISSED_AT_KEY = "agroz:homescreen_dismissed_at";
const ADDED_FLAG_KEY = "agroz:homescreen_added";
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

/**
 * Umumiy funksiya:
 * 1) Telegram Mini App `tg.addToHomeScreen()` mavjud bo'lsa -> darhol chaqiradi.
 * 2) Brauzer PWA `beforeinstallprompt` mavjud bo'lsa -> darhol chaqiradi.
 * 3) Aks holda `false` qaytaradi (shunda foydalanuvchiga 2 qadamli ko'rsatma modali ochiladi).
 */
export async function triggerEasyHomeScreenAdd(): Promise<"native_triggered" | "show_guide"> {
  haptic("medium");
  const tg = getTelegram();

  if (tg && canAddToHomeScreen(tg)) {
    const status = await checkTelegramHomeScreenStatus(tg);
    if (status !== "unsupported") {
      const ok = promptAddToHomeScreen(tg);
      if (ok) {
        return "native_triggered";
      }
    }
  }

  if (globalDeferredPrompt) {
    try {
      await globalDeferredPrompt.prompt();
      const choice = await globalDeferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        try {
          localStorage.setItem(ADDED_FLAG_KEY, "1");
        } catch {
          /* ignore */
        }
      }
      globalDeferredPrompt = null;
      return "native_triggered";
    } catch {
      /* fall through to guide */
    }
  }

  return "show_guide";
}

export function HomeScreenGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] rounded-3xl bg-white p-5 text-neutral-900 shadow-2xl border border-neutral-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-[#039e1e]">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-neutral-900 leading-tight">
                Bosh ekranga qo&apos;shish
              </h3>
              <p className="text-[11.5px] text-neutral-500">
                2 soniyada telefon ekraniga chiqarish
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 active:scale-95 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2.5 rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/80 text-[13px] text-neutral-700">
          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#039e1e] text-[12px] font-black text-white">
              1
            </span>
            <p className="leading-snug pt-0.5">
              Yuqori o&apos;ng burchakdagi{" "}
              <span className="inline-flex items-center rounded-md bg-white px-1.5 py-0.5 font-bold text-neutral-900 border border-neutral-200">
                <MoreVertical size={13} className="inline" /> uch nuqta
              </span>{" "}
              tugmasini bosing.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#039e1e] text-[12px] font-black text-white">
              2
            </span>
            <p className="leading-snug pt-0.5">
              Menyudan{" "}
              <b className="text-neutral-900">
                &ldquo;Bosh ekranga qo&apos;shish&rdquo; (Add to Home Screen)
              </b>{" "}
              bandini tanlang.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex w-full min-h-[44px] items-center justify-center rounded-2xl bg-[#039e1e] py-3 text-[14px] font-bold text-white shadow-xs hover:bg-[#028518] active:scale-98 transition"
        >
          Tushunarli
        </button>
      </div>
    </div>
  );
}

/**
 * Header yoki Profil uchun doim ko'rinib turadigan tezkor "Bosh ekranga qo'shish" tugmasi.
 */
export function AddToHomeScreenButton({ variant = "header" }: { variant?: "header" | "profile" }) {
  const [alreadyAdded, setAlreadyAdded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(ADDED_FLAG_KEY) === "1") {
        setAlreadyAdded(true);
      }
    } catch {
      /* ignore */
    }

    let eventCleanup: (() => void) | null = null;
    const stop = onTelegramReady((tg) => {
      void (async () => {
        const status = await checkTelegramHomeScreenStatus(tg);
        if (status === "added") {
          setAlreadyAdded(true);
          try {
            localStorage.setItem(ADDED_FLAG_KEY, "1");
          } catch {
            /* ignore */
          }
        }
      })();

      const handleAdded = () => {
        setAlreadyAdded(true);
        try {
          localStorage.setItem(ADDED_FLAG_KEY, "1");
        } catch {
          /* ignore */
        }
      };
      tg.onEvent?.("homeScreenAdded", handleAdded);
      eventCleanup = () => {
        tg.offEvent?.("homeScreenAdded", handleAdded);
      };
    });

    return () => {
      stop();
      if (eventCleanup) eventCleanup();
    };
  }, []);

  async function handleClick() {
    const res = await triggerEasyHomeScreenAdd();
    if (res === "show_guide") {
      setGuideOpen(true);
    }
  }

  if (variant === "profile") {
    return (
      <>
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#039e1e] text-white shadow-2xs">
              <Smartphone size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[14.5px] font-bold text-neutral-900 leading-tight">
                Bosh ekranga qo&apos;shish
              </p>
              <p className="text-[12px] text-neutral-600 mt-0.5 leading-snug">
                {alreadyAdded
                  ? "Ilova telefon ekraniga qo'shilgan"
                  : "Ilovani telefon ekranidan 1 bosishda oching"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClick}
            className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-[#039e1e] px-3.5 py-2 text-[12.5px] font-bold text-white shadow-2xs hover:bg-[#028518] active:scale-95 transition"
          >
            {alreadyAdded ? (
              <>
                <CheckCircle2 size={15} />
                <span>Qo&apos;shish</span>
              </>
            ) : (
              <>
                <PlusCircle size={15} />
                <span>Qo&apos;shish</span>
              </>
            )}
          </button>
        </div>

        <HomeScreenGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      </>
    );
  }

  if (alreadyAdded) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex h-11 min-h-[44px] items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[12px] font-bold text-[#039e1e] shadow-2xs hover:bg-emerald-100 active:scale-95 transition"
      >
        <Smartphone size={15} />
        <span>Ekranimga</span>
      </button>

      <HomeScreenGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}

/**
 * Asosiy sahifa (Home) tepasida darhol ko'rinadigan "Bosh ekranga qo'shish" banneri.
 */
export default function HomeScreenPromptBanner() {
  const [visible, setVisible] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Botdan yoki havoladan ?add_to_home=1 bilan kirganda avtomatik qo'shish dialogini ochish
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add_to_home") === "1" || params.get("install") === "1") {
        const timer = window.setTimeout(async () => {
          const res = await triggerEasyHomeScreenAdd();
          if (res !== "native_triggered") {
            setGuideOpen(true);
          }
        }, 600);
        return () => window.clearTimeout(timer);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    try {
      if (localStorage.getItem(ADDED_FLAG_KEY) === "1") {
        return;
      }
      const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY) || "0") || 0;
      if (dismissedAt > 0 && Date.now() - dismissedAt < THREE_DAYS_MS) {
        return;
      }
    } catch {
      /* ignore */
    }

    // Darhol ko'rsatamiz (foydalanuvchi 2-marta kirishini kutib o'tirmaydi)
    setVisible(true);

    let eventCleanup: (() => void) | null = null;
    const cleanup = onTelegramReady((tg) => {
      if (cancelled) return;

      void (async () => {
        const status = await checkTelegramHomeScreenStatus(tg);
        if (cancelled) return;
        if (status === "added") {
          try {
            localStorage.setItem(ADDED_FLAG_KEY, "1");
          } catch {
            /* ignore */
          }
          setVisible(false);
        }
      })();

      const handleHomeScreenAdded = () => {
        try {
          localStorage.setItem(ADDED_FLAG_KEY, "1");
        } catch {
          /* ignore */
        }
        setVisible(false);
      };

      tg.onEvent?.("homeScreenAdded", handleHomeScreenAdded);
      eventCleanup = () => {
        tg.offEvent?.("homeScreenAdded", handleHomeScreenAdded);
      };
    });

    return () => {
      cancelled = true;
      cleanup();
      if (eventCleanup) eventCleanup();
    };
  }, []);

  function handleDismiss() {
    haptic("light");
    try {
      localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  async function handleAdd() {
    const res = await triggerEasyHomeScreenAdd();
    if (res === "native_triggered") {
      setVisible(false);
    } else {
      setGuideOpen(true);
    }
  }

  if (!visible && !guideOpen) return null;

  return (
    <>
      {visible && (
        <div className="mt-3.5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#039e1e] text-white shadow-2xs">
                <Smartphone size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-black text-neutral-900 leading-tight">
                  AgrozGO&apos;ni telefon ekraniga qo&apos;shing
                </p>
                <p className="mt-0.5 text-[11.5px] text-neutral-600 leading-snug">
                  Bir bosishda tez kirish uchun yorliq yarating
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAdd}
                className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#039e1e] px-3.5 py-2 text-[12.5px] font-bold text-white shadow-2xs transition active:scale-95 hover:bg-[#028518]"
              >
                + Qo&apos;shish
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Yopish"
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-neutral-500 transition hover:bg-emerald-100/60 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <HomeScreenGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
