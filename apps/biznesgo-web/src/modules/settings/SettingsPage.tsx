import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/providers/AppContext';
import {
  Store,
  Printer,
  Save,
  CheckCircle2,
  Send,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { business, updateBusiness } = useApp();
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState(business?.name ?? 'Mening Do‘konim');
  const [storePhone, setStorePhone] = useState(business?.phone ?? '+998 90 123 45 67');
  const [storeAddress, setStoreAddress] = useState(business?.address ?? 'Toshkent viloyati, Yangiyo‘l');
  const [printerWidth, setPrinterWidth] = useState<'58mm' | '80mm'>('80mm');
  const [receiptFooter, setReceiptFooter] = useState('Xaridingiz uchun rahmat! Yana kutamiz.');
  const [telegramDailySummary, setTelegramDailySummary] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusiness({
      name: storeName,
      phone: storePhone,
      address: storeAddress,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      
      {/* Yuqori sarlavha va Orqaga qaytish */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-[#111215] mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Orqaga qaytish</span>
          </button>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111215] tracking-tight">
            Do‘kon & Tizim Sozlamalari
          </h2>
          <p className="text-xs text-neutral-400 font-semibold mt-1">
            Savdo nuqtasi rekvizitlari, kassa cheki formati va xavfsizlik parametrlari
          </p>
        </div>

        {/* Tezkor profil kartochkasi */}
        <div className="bg-white rounded-2xl p-3 px-4 shadow-2xs flex items-center gap-3 self-start sm:self-auto border-0">
          <div className="w-10 h-10 rounded-xl bg-[#efefec] text-[#111215] flex items-center justify-center">
            <Store className="h-5 w-5 text-[#111215]" />
          </div>
          <div>
            <p className="text-xs font-black text-[#111215]">{storeName}</p>
            <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              Faol savdo nuqtasi
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-[24px] bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 border-0 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>Barcha o‘zgarishlar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Do'kon Rekvizitlari */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-2xs border-0 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="w-11 h-11 rounded-2xl bg-[#efefec] text-[#111215] flex items-center justify-center">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111215]">Do‘kon & Filial Rekvizitlari</h3>
              <p className="text-[11px] text-neutral-400 font-medium">Xaridor cheklarida va hisobotlarda aks etadigan ma’lumotlar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                <span>Do‘kon yoki Korxona Nomi</span>
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Masalan: Agromir Dorixona"
                className="w-full bg-[#efefec] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-neutral-400" />
                <span>Aloqa telefoni</span>
              </label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full bg-[#efefec] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0 transition-all font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                <span>Do‘kon / Ombor Manzili</span>
              </label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Shahar, tuman, ko‘cha va do‘kon raqami"
                className="w-full bg-[#efefec] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0 transition-all"
              />
            </div>
          </div>
        </div>

        {/* 2. Chek Printer Sozlamalari */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-2xs border-0 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="w-11 h-11 rounded-2xl bg-[#efefec] text-[#111215] flex items-center justify-center">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111215]">Termal Chek Printeri (POS)</h3>
              <p className="text-[11px] text-neutral-400 font-medium">Kassa lentalari va chek formati sozlamasi</p>
            </div>
          </div>

          <div className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-neutral-700 mb-2">Lenta Kengligi (Qog‘oz formati)</label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setPrinterWidth('80mm')}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-0 ${
                    printerWidth === '80mm'
                      ? 'bg-[#111215] text-white shadow-2xs'
                      : 'bg-[#efefec] hover:bg-[#e8e8e4] text-[#111215]'
                  }`}
                >
                  <p className="text-sm font-black">80 mm (Katta chek)</p>
                  <p className={`text-[10px] font-medium mt-0.5 ${printerWidth === '80mm' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    Standart stol usti printeri
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrinterWidth('58mm')}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-0 ${
                    printerWidth === '58mm'
                      ? 'bg-[#111215] text-white shadow-2xs'
                      : 'bg-[#efefec] hover:bg-[#e8e8e4] text-[#111215]'
                  }`}
                >
                  <p className="text-sm font-black">58 mm (Kichik chek)</p>
                  <p className={`text-[10px] font-medium mt-0.5 ${printerWidth === '58mm' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    Mobil bluetooth mini printer
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-neutral-400" />
                <span>Chek tagidagi minnatdorchilik matni (Footer)</span>
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Xaridingiz uchun rahmat! Yana kutamiz."
                className="w-full bg-[#efefec] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0 transition-all"
              />
            </div>
          </div>
        </div>

        {/* 3. Telegram Bot Integratsiyasi */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-2xs border-0 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="w-11 h-11 rounded-2xl bg-[#efefec] text-[#111215] flex items-center justify-center">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111215]">Telegram Bot Xabarnomalari</h3>
              <p className="text-[11px] text-neutral-400 font-medium">Kunlik kassa yopilishi va qarz eslatmalarini Telegramga avto-yuborish</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs py-2 bg-[#f7f7f5] p-4 rounded-2xl">
            <div className="pr-4">
              <p className="font-black text-[#111215]">Kunlik kassa yakunini Telegramga yuborish</p>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                Har kuni 20:00 da bugungi jami naqd, karta va qarz hisoboti botga avtomatik keladi
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTelegramDailySummary(!telegramDailySummary)}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                telegramDailySummary ? 'bg-[#35ca56]' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full transition-transform absolute top-1 ${
                  telegramDailySummary ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Saqlash tugmasi */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#111215] hover:bg-[#35ca56] text-white font-black text-xs px-8 py-3.5 rounded-2xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>O‘zgarishlarni saqlash</span>
          </button>
        </div>

      </form>
    </div>
  );
};
