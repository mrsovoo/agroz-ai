import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Foydalanish Shartlari (Terms of Service) — AgrozGO",
  description: "AgrozGO ilovasi va veb-platformasidan foydalanish bo'yicha rasmiy shartlar va qoidalar.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-5 pt-8 pb-32 text-neutral-900 max-w-[720px] mx-auto animate-in fade-in duration-200">
      <div className="mb-6">
        <Link
          href="/profil"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-emerald-700 hover:text-emerald-800 transition"
        >
          <ArrowLeft size={16} />
          <span>Orqaga qaytish</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-[22px] sm:text-[26px] font-bold text-neutral-900 leading-tight">
                Foydalanish Shartlari (Terms of Service)
              </h1>
              <p className="text-[13px] text-neutral-400">
                So&apos;nggi yangilanish: 2026-yil 1-oktyabr
              </p>
            </div>
          </div>
          <p className="text-[14.5px] text-neutral-600 leading-relaxed mt-4">
            Ushbu hujjat <b>AgrozGO</b> mobil ilovasi va <b>agroz.uz</b> veb-xizmatlaridan foydalanish qoidalarini belgilaydi. Ilovadan foydalanish orqali siz mazkur shartlarga rozilik bildirasiz.
          </p>
        </div>

        {/* 1. Xizmat maqsadi */}
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-neutral-800 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            1. Platforma xizmatlari
          </h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed">
            AgrozGO qishloq xo&apos;jaligi sohasidagi dehqonlar, fermerlar va mutaxassislar uchun axborot va xizmat ko&apos;rsatish platformasidir:
          </p>
          <ul className="space-y-1.5 text-[14px] text-neutral-600 list-disc pl-5 leading-relaxed">
            <li>O&apos;simlik kasalliklari va zararkunandalarini AI orqali aniqlash va agronomik tavsiyalar olish;</li>
            <li>Yaqin atrofdagi agro-do&apos;konlardan kerakli agro va veterinariya mahsulotlarini qidirish va yetkazib berish xizmatidan foydalanish;</li>
            <li>Agro-mutaxassislar bilan maslahatlashish va qo&apos;ng&apos;iroq qilish imkoniyati;</li>
            <li>Hududiy ob-havo ma&apos;lumotlari va ekinlarni himoya qilish bo&apos;yicha agrometeorologik tavsiyalar.</li>
          </ul>
        </section>

        {/* 2. Foydalanuvchi majburiyatlari */}
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-neutral-800">
            2. Foydalanuvchi majburiyatlari
          </h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed">
            Foydalanuvchi quyidagilarga amal qilishi shart:
          </p>
          <ul className="space-y-1.5 text-[14px] text-neutral-600 list-disc pl-5 leading-relaxed">
            <li>Ro&apos;yxatdan o&apos;tishda to&apos;g&apos;ri va aniq aloqa ma&apos;lumotlarini ko&apos;rsatish;</li>
            <li>Platforma xavfsizligiga tahdid soluvchi harakatlarni amalga oshirmaslik;</li>
            <li>Buyurtma qilingan tovarlarni qabul qilishda yetkazib beruvchi qoidalariga rioya qilish.</li>
          </ul>
        </section>

        {/* 3. Javobgarlik chegarasi */}
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-neutral-800">
            3. Javobgarlik chegarasi
          </h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed">
            Sun&apos;iy intellekt (AI) tomonidan beriladigan tashxislar va tavsiyalar maslahat xarakteriga ega bo&apos;lib, jiddiy zararlanishlarda litsenziyalangan agronom mutaxassis ko&apos;rigi tavsiya etiladi. Preparatlardan foydalanishda ularning ishlab chiqaruvchisi yo&apos;riqnomasiga qat&apos;iy rioya qilish foydalanuvchining o&apos;z zimmasidadir.
          </p>
        </section>

        {/* 4. Shartlarning o'zgarishi */}
        <section className="space-y-3 pt-2 border-t border-neutral-100">
          <h2 className="text-[17px] font-bold text-neutral-800">
            4. Bog&apos;lanish
          </h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed">
            Savol va e&apos;tirozlar uchun: <b>info@agroz.uz</b>
          </p>
        </section>
      </div>
    </main>
  );
}
