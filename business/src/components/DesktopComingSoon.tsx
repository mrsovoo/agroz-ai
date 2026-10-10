"use client";

import React from "react";
import Image from "next/image";

export default function DesktopComingSoon({ type = "frontend" }: { type?: "frontend" | "business" }) {
  const isBiz = type === "business";
  const goColor = isBiz ? "text-[#1b1464]" : "text-[#028e11]";
  const botLink = isBiz 
    ? (process.env.NEXT_PUBLIC_TG_OPEN_URL || "https://t.me/agroz_auth_bot")
    : (process.env.NEXT_PUBLIC_TG_OPEN_URL || "https://t.me/agrozai_bot");

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden flex flex-col items-center pt-8 md:pt-12 font-sans selection:bg-gray-200">
      
      {/* Logotip */}
      <div className="z-10 flex items-center mb-8">
        <h1 className="text-3xl md:text-5xl font-black tracking-wider text-black">
          AGROZ<span className={goColor}>GO</span>
        </h1>
      </div>

      {/* Orqa fondagi TEZ KUNDA gradient matn */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
        }}
      >
        <h2 className="text-[120px] md:text-[200px] lg:text-[280px] font-black tracking-tighter text-[#e6e6e6] whitespace-nowrap leading-none opacity-60">
          TEZ KUNDA
        </h2>
      </div>

      {/* Kartalar Konteyneri */}
      <div className="z-10 w-full max-w-6xl px-4 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mt-12">
        
        {/* Chap Karta (Ferma Max) */}
        <div className="w-full md:w-1/3 bg-white/90 backdrop-blur-md rounded-[32px] p-6 shadow-xl border border-gray-100 flex flex-col items-center text-center transform md:-translate-y-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden shadow-inner">
             {/* Dummy avatar, no real image needed based on prompt, just a placeholder icon or div */}
             <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-2xl">FM</div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Ferma Max | Chorva, Parranda</h3>
          <p className="text-sm text-gray-500 mb-4">🐄 24K obunachi • 🐓 Mutaxassis</p>
          <a href="https://t.me/ferma_max" target="_blank" rel="noreferrer" className="w-full bg-[#0088cc] text-white font-semibold py-3 rounded-2xl hover:bg-[#0077b3] transition-colors flex items-center justify-center gap-2">
             Obuna bo'lish
          </a>
        </div>

        {/* Markaziy Karta (AgrozGO) */}
        <div className="w-full md:w-1/3 bg-white rounded-[32px] p-8 shadow-2xl border border-gray-100 flex flex-col items-center text-center z-20">
          <p className="text-gray-500 font-medium mb-3">O'zbekistondagi</p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-4">
             <span className="px-3 py-1 bg-[#028e11]/10 text-[#028e11] rounded-full text-sm font-semibold">Dehqon</span>
             <span className="px-3 py-1 bg-[#028e11]/10 text-[#028e11] rounded-full text-sm font-semibold">Fermer</span>
             <span className="px-3 py-1 bg-[#028e11]/10 text-[#028e11] rounded-full text-sm font-semibold">Chorvadorlar</span>
             <span className="px-3 py-1 bg-[#fcbd00]/20 text-yellow-700 rounded-full text-sm font-semibold">Agro-do'kon</span>
             <span className="px-3 py-1 bg-[#fcbd00]/20 text-yellow-700 rounded-full text-sm font-semibold">Mutaxassislar</span>
          </div>
          
          <p className="text-gray-700 leading-relaxed mb-8">
            bilan bitta ilovada bog'laydigan platforma. Hozir veb va Telegram Mini App sifatida ishlaydi. iOS va Android ilovalar chiqarishga tayyorlanmoqda.
          </p>

          <a href={botLink} className={`w-full ${isBiz ? 'bg-[#1b1464]' : 'bg-[#028e11]'} text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center text-lg shadow-lg`}>
            Telegramda ochish
          </a>
        </div>

        {/* O'ng Karta (Agro Yordam) */}
        <div className="w-full md:w-1/3 bg-white/90 backdrop-blur-md rounded-[32px] p-6 shadow-xl border border-gray-100 flex flex-col items-center text-center transform md:-translate-y-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden shadow-inner">
             <div className="w-full h-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-2xl">AY</div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Agronom Maslahatlari | Agro Yordam</h3>
          <p className="text-sm text-gray-500 mb-4">🌱 12K obunachi • 👨‍🌾 Konsultant</p>
          <a href="https://t.me/agroyordamuz" target="_blank" rel="noreferrer" className="w-full bg-[#0088cc] text-white font-semibold py-3 rounded-2xl hover:bg-[#0077b3] transition-colors flex items-center justify-center gap-2">
             Obuna bo'lish
          </a>
        </div>

      </div>
    </div>
  );
}
