import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, Database, Trash2, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Maxfiylik Siyosati (Privacy Policy) — AgrozGO",
  description: "AgrozGO ilovasida shaxsiy ma'lumotlarni yig'ish, saqlash, himoya qilish va o'chirish siyosati.",
};

export default function PrivacyPolicyPage() {
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
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-[22px] sm:text-[26px] font-bold text-neutral-900 leading-tight">
                Maxfiylik Siyosati (Privacy Policy)
              </h1>
              <p className="text-[13px] text-neutral-400">
                So&apos;nggi yangilanish: 2026-yil 1-oktyabr
              </p>
            </div>
          </div>
          <p className="text-[14.5px] text-neutral-600 leading-relaxed mt-4">
            Ushbu Maxfiylik Siyosati <b>AgrozGO</b> mobil ilovasi va <b>agroz.uz</b> veb-platformasi (keyingi o&apos;rinlarda &ldquo;Xizmat&rdquo;) foydalanuvchilarining shaxsiy ma&apos;lumotlarini qanday yig&apos;ishi, ishlatishi va himoya qilishini tushuntiradi.
          </p>
        </div>

        {/* 1. Yig'iladigan ma'lumotlar */}
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-neutral-800 flex items-center gap-2">
            <Database size={18} className="text-emerald-600" />
            1. Qanday ma&apos;lumotlar yig&apos;iladi?
          </h2>
          <ul className="space-y-2 text-[14px] text-neutral-600 list-disc pl-5 leading-relaxed">
            <li>
              <b>Shaxsiy ma&apos;lumotlar:</b> Ism, familiya va telefon raqami (hisob yaratish va buyurtmalarni yetkazish uchun).
            </li>
            <li>
              <b>Geolokatsiya (Aniq va taxminiy joylashuv):</b> Foydalanuvchiga eng yaqin agro-do&apos;konlar, mutaxassislar va o&apos;z hududiga mos ob-havo ma&apos;lumotlari hamda agrometeorologik tavsiyalarni ko&apos;rsatish uchun.
            </li>
            <li>
              <b>Kamera va Rasmlar:</b> O&apos;simlik barglari, zararkunandalar va kasalliklarini sun&apos;iy intellekt (AI) orqali tahlil qilish uchun yuklangan fotosuratlar.
            </li>
            <li>
              <b>Xaridlar va buyurtmalar:</b> Agro va veterinariya mahsulotlarini buyurtma qilish tarixi va yetkazib berish manzillari.
            </li>
            <li>
              <b>Qurilma ma&apos;lumotlari:</b> Push-bildirishnomalarni yetkazish uchun qurilma tokeni (FCM/APNs) va operatsion tizim turi.
            </li>
          </ul>
        </section>

        {/* 2. Ma'lumotlardan foydalanish */}
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-neutral-800 flex items-center gap-2">
            <Eye size={18} className="text-emerald-600" />
            2. Ma&apos;lumotlar qanday maqsadda ishlatiladi?
          </h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed">
            Yig&apos;ilgan ma&apos;lumotlar quyidagi maqsadlarda foydalaniladi:
          </p>
          <ul className="space-y-1.5 text-[14px] text-neutral-600 list-disc pl-5 leading-relaxed">
            <li>Agro-tashxis (AI diagnoz) natijalarini va dastlabki maslahatlarni taqdim etish;</li>
            <li>Yaqin agro-do&apos;konlar orqali agro va veterinariya mahsulotlarini yetkazib berishni tashkil qilish;</li>
            <li>Real vaqt rejimida buyurtma holati haqida push-bildirishnomalar yuborish;</li>
            <li>Hududiy ob-havo ma&apos;lumotlari va agrometeorologik tavsiyalar berish;</li>
            <li>Foydalanuvchilarni autentifikatsiya qilish va xavfsizligini ta&apos;minlash.</li>
          </ul>
        </section>

        {/* 3. Ma'lumotlar xavfsizligi */}
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-neutral-800 flex items-center gap-2">
            <Lock size={18} className="text-emerald-600" />
            3. Ma&apos;lumotlar xavfsizligi va himoyasi
          </h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed">
            Barcha ma&apos;lumotlar tarmoq orqali uzatilganda <b>HTTPS (SSL/TLS 256-bit)</b> shifrlash protokoli bilan himoyalangan. Biz sizning shaxsiy ma&apos;lumotlaringizni, telefon raqamingizni yoki joylashuvingizni uchinchi shaxslarga tijoriy maqsadlarda sotmaymiz va bermaymiz.
          </p>
        </section>

        {/* 4. Hisobni o'chirish huquqi */}
        <section className="space-y-3 bg-red-50/60 p-4 rounded-2xl border border-red-100">
          <h2 className="text-[17px] font-bold text-red-800 flex items-center gap-2">
            <Trash2 size={18} className="text-red-600" />
            4. Hisob va shaxsiy ma&apos;lumotlarni o&apos;chirish huquqi
          </h2>
          <p className="text-[14px] text-neutral-700 leading-relaxed">
            Apple App Store va Google Play talablariga muvofiq, har bir foydalanuvchi o&apos;z shaxsiy hisobini va barcha ma&apos;lumotlarini butunlay o&apos;chirish huquqiga ega.
          </p>
          <p className="text-[14px] text-neutral-700 leading-relaxed">
            Siz buni ilovaning <b>Profil</b> bo&apos;limidagi <b>&ldquo;Hisobni butunlay o&apos;chirish&rdquo;</b> tugmasi orqali 1 bosishda amalga oshirishingiz mumkin. Shuningdek, <code>info@agroz.uz</code> elektron pochtasiga so&apos;rov yuborish orqali ma&apos;lumotlaringiz serverlardan to&apos;liq yo&apos;q qilinishini talab qilishingiz mumkin.
          </p>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            <b>Eslatma:</b> Hisob o&apos;chirilganda sessiyalar, push tokenlar, AI tashxis tarixi va xabarlar to&apos;liq yo&apos;q qilinadi. Amaldagi buxgalteriya va soliq qonunchiligi talablariga muvofiq, avvalgi savdo kvitansiyalari shaxsiy ma&apos;lumotlardan to&apos;liq ajratilgan (anonimlashtirilgan) holda saqlanishi mumkin.
          </p>
        </section>

        {/* 5. Bog'lanish */}
        <section className="space-y-3 pt-2 border-t border-neutral-100">
          <h2 className="text-[17px] font-bold text-neutral-800">
            5. Bog&apos;lanish va qo&apos;llab-quvvatlash
          </h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed">
            Maxfiylik siyosati bo&apos;yicha savollaringiz yoki takliflaringiz bo&apos;lsa:
          </p>
          <div className="bg-neutral-50 p-3.5 rounded-xl text-[14px] text-neutral-700 space-y-1">
            <p><b>Platforma:</b> AgrozGO Agro-Ekotizim</p>
            <p><b>Veb-sayt:</b> <a href="https://agroz.uz" className="text-emerald-700 underline">https://agroz.uz</a></p>
            <p><b>Email:</b> <a href="mailto:info@agroz.uz" className="text-emerald-700 underline">info@agroz.uz</a></p>
            <p><b>Manzil:</b> O&apos;zbekiston Respublikasi</p>
          </div>
        </section>
      </div>
    </main>
  );
}
