import React, { useState } from 'react';
import { useApp } from '../../app/providers/AppContext';
import { Badge, Button, Input } from '../../shared/components';
import { Calendar, AlertCircle, ShieldCheck, Scale, Scissors, Sparkles, Ruler, FileText, Wrench } from 'lucide-react';

export const SectorSpecialPage: React.FC = () => {
  const { currentSector } = useApp();

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          Sektorga Xos Maxsus Imkoniyatlar: <span className="text-emerald-800 uppercase">{currentSector}</span>
        </h2>
        <p className="text-xs text-slate-500">
          Ushbu sahifada tanlangan sektorning o‘ziga xos noyob funksiyalari to‘liq ishlaydi.
        </p>
      </div>

      {/* 1. PHARMACY — FEFO & Yaroqlilik */}
      {currentSector === 'pharmacy' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              <span>FEFO Partiyalari va Yaroqlilik Muddati Nazorati</span>
            </div>
            <p className="text-xs text-slate-500">
              Kassada avtomatik birinchi navbatda muddati eng yaqin qolgan dori partiyasi sotuvga ajratiladi.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-2.5">Dori Nomi</th>
                    <th className="p-2.5">Partiya Raqami</th>
                    <th className="p-2.5">Qoldiq</th>
                    <th className="p-2.5">Yaroqlilik Muddati</th>
                    <th className="p-2.5">FEFO Holati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-rose-50/30">
                    <td className="p-2.5 font-bold">Enrofloksatsin 10% (100ml)</td>
                    <td className="p-2.5 font-mono">B-2024-11</td>
                    <td className="p-2.5 font-bold">6 flakon</td>
                    <td className="p-2.5 font-semibold text-rose-600">2026-11-15 (21 kun qoldi)</td>
                    <td className="p-2.5"><Badge variant="danger">BIRINCHI SOTILADI</Badge></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Enrofloksatsin 10% (100ml)</td>
                    <td className="p-2.5 font-mono">B-2025-04</td>
                    <td className="p-2.5 font-bold">24 flakon</td>
                    <td className="p-2.5 text-slate-600">2027-04-10 (Yangi partiya)</td>
                    <td className="p-2.5"><Badge variant="neutral">Navbatda</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. FEED — Qop ochish va kg ga konversiya */}
      {currentSector === 'feed' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Scale className="h-5 w-5 text-emerald-700" />
            <span>Qopni Ochish va Chakana (kg) Taroziga O‘tkazish</span>
          </div>
          <p className="text-xs text-slate-500">
            1 ta butun 50 kg lik qopni ochib, tarozida kilogramm lab sotish qoldig‘iga o‘tkazish.
          </p>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm text-slate-900">Kombikorm Broyler (50 kg qopda)</p>
              <p className="text-xs text-slate-500">Mavjud: 42 butun qop | Ochilgan qoldiq: 14 kg</p>
            </div>
            <Button size="md" variant="primary">
              <Scissors className="h-4 w-4 mr-1.5" /> 1 Qopni Ochish (50 kg qo‘shish)
            </Button>
          </div>
        </div>
      )}

      {/* 3. SEEDS — Urug' va ko'chat yetishtirish */}
      {currentSector === 'seeds' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Sparkles className="h-5 w-5 text-emerald-700" />
            <span>Ko‘chat Yetishtirish Partiyalari & Mavsumiy Zakazlar</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <p className="font-bold text-emerald-900">Pomidor F1 "Volgograd" Ko‘chati (Partiya #S-81)</p>
              <p className="text-slate-600 mt-1">Ekilgan: 2026-10-10 · <strong>Tayyor bo‘ladi: 2026-11-20</strong></p>
              <p className="text-emerald-700 font-semibold mt-1">Jami unib chiqqan: 8 500 tup (Unuvchanlik: 96%)</p>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
              <p className="font-bold text-blue-900">Bahorgi Oldindan Buyurtma (Bron):</p>
              <p className="text-slate-600 mt-1">Akmal Fermer: 2 000 tup bron qilgan (Avans: 500 000 so‘m olingan)</p>
              <Badge variant="info" className="mt-2">15-martga rejalashtirilgan</Badge>
            </div>
          </div>
        </div>
      )}

      {/* 4. GREENHOUSE — Smeta (BOM) Kalkulyatori */}
      {currentSector === 'greenhouse' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <FileText className="h-5 w-5 text-emerald-700" />
            <span>Issiqxona Materiallar Smetasi (BOM Kalkulyator)</span>
          </div>
          <p className="text-xs text-slate-500">
            Fermer 10 sotix issiqxona uchun kelganda: plyonka, lenta, fiting va nasosni yagona smeta qilib chiqarish.
          </p>

          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Plyonka 150 mikron (eni 8m) — 120 metr</span>
              <span className="font-bold">2 400 000 so‘m</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Tomchilatib sug‘orish lentasi 16mm — 1 500 metr</span>
              <span className="font-bold">1 800 000 so‘m</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Suv filtri va kranlar to‘plami (Komplekt) — 1 dona</span>
              <span className="font-bold">650 000 so‘m</span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-sm text-emerald-900">
              <span>Jami Smeta Qiymati:</span>
              <span>4 850 000 so‘m</span>
            </div>
          </div>
          <Button size="md" variant="primary">
            Smetani Chekka / Savdoga O‘tkazish
          </Button>
        </div>
      )}

      {/* 5. MACHINERY — Seriya raqami va Kafolat */}
      {currentSector === 'machinery' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Wrench className="h-5 w-5 text-emerald-700" />
            <span>Texnika Seriya Raqamlari, Kafolat va Servis Jurnali</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Texnika Modeli</th>
                  <th className="p-2.5">Seriya / VIN Raqami</th>
                  <th className="p-2.5">Xaridor</th>
                  <th className="p-2.5">Kafolat Muddati</th>
                  <th className="p-2.5">Servis Tarixi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-bold">Motoblok TTZ-700 (Dizel)</td>
                  <td className="p-2.5 font-mono font-bold text-slate-700">VIN-99482103</td>
                  <td className="p-2.5">Dilshod aka (+998 90 999 88 77)</td>
                  <td className="p-2.5"><Badge variant="success">2027-10-01 gacha</Badge></td>
                  <td className="p-2.5 text-slate-500">1-moy almashtirish o‘tgan (15-okt)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

