"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ImagePlus,
  Mic,
  Square,
  Sparkles,
  X,
  Loader2,
  PencilLine,
} from "lucide-react";
import { haptic } from "@/lib/telegram";

async function fileToCompressedDataUrl(file: File, max = 1024): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  try {
    const img = document.createElement("img");
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("img"));
      img.src = dataUrl;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return dataUrl;
  }
}

export default function DiagnoseForm({ category }: { category: "crop" | "animal" }) {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("Rasm tayyorlanmoqda...");
    const url = await fileToCompressedDataUrl(file);
    setImage(url);
    setStatus("Rasm yuklandi");
    setTimeout(() => setStatus(null), 1500);
  }

  async function toggleRecord() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (ev) => chunksRef.current.push(ev.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setStatus("Ovoz matnga aylantirilmoqda...");
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("audio", blob);
        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = (await res.json()) as { text?: string; note?: string };
          if (data.text) setText((prev) => (prev ? `${prev} ${data.text}` : data.text!));
          setStatus(data.note ?? "Ovoz yozib olindi");
        } catch {
          setStatus("Xatolik, iltimos yozib yuboring.");
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setStatus("Yozilmoqda... Muammoni o'zbek tilida gapiring");
    } catch {
      setStatus("Mikrofonga ruxsat berilmadi.");
    }
  }

  async function analyze() {
    haptic("medium");
    setError(null);
    if (!image && !text.trim()) {
      setError("Iltimos rasm yuklang yoki muammoni yozing.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, text, imageDataUrl: image }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "Xatolik");
      router.push(`/natija/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tahlil qilib bo'lmadi");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPick}
      />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onPick} />

      {image ? (
        <div className="relative overflow-hidden rounded-[24px] shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="tanlangan rasm" className="w-full object-cover" />
          <button
            onClick={() => {
              setImage(null);
              if (cameraRef.current) cameraRef.current.value = "";
              if (galleryRef.current) galleryRef.current.value = "";
            }}
            className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-sm font-bold text-white backdrop-blur"
          >
            <X size={14} /> O'zgartirish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-[24px] p-5 text-white shadow-[0_16px_30px_-16px_rgba(2,142,17,0.5)] active:scale-95"
            style={{ background: "linear-gradient(135deg,#028e11,#76b44d)" }}
          >
            <Camera size={38} strokeWidth={1.8} />
            <span className="text-[15px] font-bold">Kamera</span>
            <span className="text-[11px] opacity-80">Rasmga olish</span>
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="ios-card flex flex-col items-center gap-2 p-5 active:scale-95"
          >
            <ImagePlus size={38} strokeWidth={1.8} className="text-[var(--brand-green)]" />
            <span className="mt-1 text-[15px] font-bold">Galereya</span>
            <span className="text-[11px] text-[var(--brand-muted)]">Rasm tanlash</span>
          </button>
        </div>
      )}

      <button
        onClick={toggleRecord}
        className="ios-btn yellow"
        style={
          recording
            ? { background: "#d7263d", color: "#fff", boxShadow: "0 6px 16px -6px rgba(215,38,61,.5)" }
            : undefined
        }
      >
        {recording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
        {recording ? "Yozishni to'xtatish" : "Gapirib tushuntirish"}
      </button>

      <div className="relative">
        <PencilLine
          size={18}
          className="pointer-events-none absolute left-4 top-4 text-[var(--brand-muted)]"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={
            category === "crop"
              ? "Masalan: Pomidor barglarida qora dog'lar paydo bo'ldi, pastki barglari quriyapti..."
              : "Masalan: Sigir yem yemayapti, yo'talyapti va isitmasi bor..."
          }
          className="ios-input resize-none pl-11 leading-relaxed"
        />
      </div>

      {status && (
        <div
          className="rounded-2xl p-3 text-[13px] font-medium"
          style={{ background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }}
        >
          {status}
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-[var(--brand-red-soft)] p-3 text-[13px] font-semibold text-[#d7263d]">
          {error}
        </div>
      )}

      <button onClick={analyze} disabled={loading} className="ios-btn ink" style={{ padding: "18px", fontSize: 17 }}>
        {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
        {loading ? "AI tahlil qilmoqda..." : "Tahlil qilish"}
      </button>

      <p className="text-center text-[11px] text-[var(--brand-muted)]">
        Tavsiyalar maslahat xarakterida. Jiddiy holatlarda mutaxassisga murojaat qiling.
      </p>
    </div>
  );
}
