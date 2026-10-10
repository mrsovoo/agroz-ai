"use client";

import React from "react";

export default function PhoneTelegramPrompt({ type = "frontend" }: { type?: "frontend" | "business" }) {
  const isBiz = type === "business";
  const goColor = isBiz ? "text-[#1b1464]" : "text-[#028e11]";
  const botLink = isBiz 
    ? (process.env.NEXT_PUBLIC_TG_OPEN_URL || "https://t.me/agroz_auth_bot")
    : (process.env.NEXT_PUBLIC_TG_OPEN_URL || "https://t.me/agrozai_bot");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 text-center">
      <div className="mb-6">
        <h1 className="text-4xl font-black tracking-wider text-black">
          AGROZ<span className={goColor}>GO</span>
        </h1>
      </div>
      
      <p className="text-gray-600 mb-8 max-w-sm text-lg">
        Platforma hozircha faqat Telegram Mini App sifatida ishlaydi. Ilovani to'laqonli brauzer versiyasi <strong>Tez kunda</strong> ishga tushadi.
      </p>
      
      <a 
        href={botLink}
        className={`w-full max-w-xs ${isBiz ? 'bg-[#1b1464]' : 'bg-[#028e11]'} text-white font-bold py-4 px-6 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center text-lg`}
      >
        Telegramda ochish
      </a>
      
      <p className="mt-6 text-sm text-gray-400">
        iOS va Android ilovalar chiqarishga tayyorlanmoqda
      </p>
    </div>
  );
}
