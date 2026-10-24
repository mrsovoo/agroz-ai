import React from 'react';
import { ShieldCheck, Lock, Store, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Do'kon Sozlamalari & Profil</h2>
        <p className="text-xs text-slate-500">BiznesGO B2B 1-Sektor konfiguratsiyasi</p>
      </div>

      {/* Sektor Qulflangan Bloki */}
      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
        <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Faol Sektor: Agro-Vet Dorixona & O'g'itlar</span>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          Ushbu do'kon hisobi qat'iy ravishda <strong>1-sektor (Veterinariya va Agro dorixona)</strong> uchun moslashtirilgan. FEFO muddat nazorati, partiya seriyasi va maxsus dorixona POS kassa tizimi faollashtirilgan. Boshqa sektorlarga almashtirish qulflangan.
        </p>
      </div>

      {/* Profil Ma'lumotlari */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          Do'kon Ma'lumotlari
        </h3>

        <div className="space-y-3">
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Do'kon nomi:</label>
            <div className="flex items-center space-x-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Store className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">Agro-Vet Markaziy Dorixonasi</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Biznes Turi (Sektor):</label>
            <div className="flex items-center justify-between p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500">
              <span className="font-mono font-bold text-slate-700">agro_vet (Veterinariya & O'g'it)</span>
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3" />
                <span>O'zgartirib bo'lmaydi</span>
              </span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Aloqa telefoni:</label>
            <div className="flex items-center space-x-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="font-mono text-slate-800">+998 90 123 45 67</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Manzil:</label>
            <div className="flex items-center space-x-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-slate-800">Toshkent viloyati, Yangiyo'l tumani, Dehqon bozori 4-do'kon</span>
            </div>
          </div>
        </div>

        <div className="pt-2 text-slate-400 text-[11px] flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tizim holati: B2B Agro-Vet v1.0.0 (ACID PostgreSQL ulanishi faol)</span>
        </div>
      </div>
    </div>
  );
};

