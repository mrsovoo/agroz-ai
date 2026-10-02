"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  Upload,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
  ShoppingBag,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { isNativeApp, takeNativePhoto } from "@/lib/capacitor";

function resizeDataUrl(dataUrl: string, maxDim = 1280): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function resizeImageFile(file: File, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = e.target?.result as string;
        const resized = await resizeDataUrl(raw, maxDim);
        resolve(resized);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type DiagnosisResult = {
  id: number;
  category: string;
  disease: string;
  solution: string;
  medicines: string[];
  severity: string;
  prevention?: string;
  confidence: number;
  source: string;
  hasImage: boolean;
  disclaimer: string;
};

export default function DiagnoseCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const rawCat = Array.isArray(params?.category) ? params.category[0] : params?.category;
  const isAnimal = rawCat === "animal" || rawCat === "chorva";
  const categoryKey = isAnimal ? "animal" : "crop";
  const title = isAnimal ? "Chorva tashxisi" : "Ekin va o'simlik tashxisi";
  const placeholder = isAnimal
    ? "Hayvon turi, kasallik belgilari, harorati yoki xatti-harakatidagi o'zgarishlarni yozing..."
    : "Ekin turi, bargdagi dog'lar, qurish yoki zararkunanda belgilarini yozing...";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  
  import('react').then(({ useEffect }) => {
    useEffect(() => {
      setConsent(localStorage.getItem('ai_consent') === 'true');
    }, []);
  });
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  async function handlePickImage() {
    setError(null);
    if (isNativeApp()) {
      try {
        const photo = await takeNativePhoto();
        if (photo) {
          const optimized = await resizeDataUrl(photo, 1280);
          setImagePreview(optimized);
        }
      } catch (e: any) {
        setError("Kameradan rasm olishda xatolik yuz berdi");
      }
    } else {
      fileInputRef.current?.click();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm fayllarini yuklash mumkin (JPG, PNG)");
      return;
    }

    try {
      setLoading(true);
      const optimized = await resizeImageFile(file, 1280);
      setImagePreview(optimized);
      setError(null);
    } catch {
      setError("Rasmni qayta ishlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  function handleRemoveImage() {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !imagePreview) {
      setError("Iltimos, kasallik haqida qisqa yozing yoki rasm yuklang");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryKey,
          text: text.trim(),
          imageDataUrl: imagePreview,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Tashxis tahlilida xatolik yuz berdi");
      }

      setResult(data.diagnosis);
    } catch (err: any) {
      setError(
        err.message ||
          "AI xizmati bilan bog'lanishda xatolik yuz berdi. Iltimos qayta urinib ko'ring yoki mutaxassisga murojaat qiling.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setImagePreview(null);
    setText("");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-900 pb-28">
      <div className="mx-auto max-w-lg">
        {!consent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-black text-neutral-900">Google AI Roziligi</h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Tashxis uchun kiritgan rasm va ma'lumotlaringiz Google Gemini AI orqali tahlil qilinadi. Dastlabki tashxis hisoblanib, aniq kafolat berilmaydi.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('ai_consent', 'true');
                    setConsent(true);
                  }}
                  className="flex-1 rounded-xl bg-[#039e1e] py-3 text-sm font-bold text-white shadow-xs"
                >
                  Tushundim, roziman
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 rounded-xl bg-neutral-100 py-3 text-sm font-bold text-neutral-700"
                >
                  Orqaga
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Yuqori navigatsiya */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 shadow-2xs transition active:scale-95"
          >
            <ArrowLeft size={15} />
            Orqaga
          </button>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
            {isAnimal ? "Veterinariya" : "Agro-fitosanitariya"}
          </span>
        </div>

        {/* Natija oynasi */}
        {result ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle2 size={24} className="text-[#039e1e]" />
                <h1 className="text-lg font-black tracking-tight text-neutral-900">
                  Tashxis natijasi
                </h1>
              </div>

              {/* Kasallik nomi */}
              <div className="mt-4 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Aniqlangan kasallik:
                </span>
                <p className="mt-1 text-base font-black text-neutral-900">
                  {result.disease}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-neutral-500">
                    Ishonch darajasi:
                  </span>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    {result.confidence}%
                  </span>
                </div>
              </div>

              {/* Tavsiya etilgan yechim */}
              <div className="mt-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Tavsiya etilgan choralar:
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-800 whitespace-pre-line font-medium">
                  {result.solution}
                </p>
              </div>

              {/* Tavsiya etilgan preparatlar */}
              {result.medicines && result.medicines.length > 0 && (
                <div className="mt-5 border-t border-neutral-100 pt-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Tavsiya etilgan agro va veterinariya mahsulotlari:
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.medicines.map((m, idx) => (
                      <span
                        key={idx}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-bold text-neutral-800"
                      >
                        💊 {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Oldini olish choralari */}
              {result.prevention && (
                <div className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-600">
                  <span className="font-bold text-neutral-700">Oldini olish: </span>
                  {result.prevention}
                </div>
              )}

              {/* MAJBURIY OGOHLANTIRISH BANNERI (Do'kon siyosati) */}
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-start gap-2.5">
                <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium leading-relaxed text-amber-900">
                  Bu dastlabki maslahat, aniq tashxis emas. Muhim holatda mutaxassisga murojaat qiling.
                </p>
              </div>

              {/* Harakatlar */}
              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href="/dorilar"
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#039e1e] px-4 py-2.5 text-sm font-bold text-white transition active:scale-95"
                >
                  <ShoppingBag size={16} />
                  Agro-mahsulotlarni agro-do&apos;konlardan qidirish
                </Link>
                <Link
                  href="/mutaxassislar"
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 transition active:scale-95"
                >
                  <UserCheck size={16} />
                  Mutaxassisni chaqirish
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-1 text-center text-xs font-bold text-neutral-500 hover:text-neutral-900"
                >
                  Boshqa tashxis qo&apos;yish
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* So'rov shakli */
          <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#039e1e]">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-neutral-900">
                  {title}
                </h1>
                <p className="text-[11px] text-neutral-500">
                  Rasm yuklang yoki belgilarni yozib tahlil qiling
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Rasm tanlash / Kamera */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-2xl border border-neutral-200">
                    <img
                      src={imagePreview}
                      alt="Tashxis uchun rasm"
                      className="h-56 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs transition hover:bg-black"
                      title="Rasmni o'chirish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePickImage}
                    disabled={loading}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/70 p-6 text-neutral-600 transition hover:bg-neutral-100/70 active:scale-98"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#039e1e] shadow-2xs">
                      <Camera size={24} />
                    </div>
                    <span className="text-xs font-bold text-neutral-800">
                      Rasmga oling yoki yuklang
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Kamera yoki galereyadan (JPG, PNG)
                    </span>
                  </button>
                )}
              </div>

              {/* Matnli tavsif */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Belgilar tavsifi:
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={placeholder}
                  rows={4}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 p-3.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-[#039e1e] focus:bg-white focus:outline-hidden"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Doimiy ogohlantirish */}
              <div className="rounded-xl bg-neutral-50 p-3 text-[11px] text-neutral-500 leading-relaxed border border-neutral-100">
                ℹ️ AI tashxis birlamchi maslahat beradi. Aniq xulosa uchun rasmni aniq yorug&apos;likda va zararlangan joyni yaqindan oling.
              </div>

              {/* Yuborish tugmasi */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#039e1e] px-4 py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>AI tahlil qilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Tashxisni aniqlash</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
