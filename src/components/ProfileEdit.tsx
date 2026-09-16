"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, X } from "lucide-react";

const REGIONS = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Qashqadaryo",
  "Surxondaryo",
  "Xorazm",
  "Jizzax",
  "Navoiy",
  "Sirdaryo",
  "Qoraqalpog'iston",
];

/** Ism va hududni shu yerda tahrirlash — alohida sahifa ochmasdan. */
export default function ProfileEdit({
  name,
  region,
  district,
}: {
  name: string | null;
  region: string | null;
  district: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editName, setEditName] = useState(name ?? "");
  const [editRegion, setEditRegion] = useState(region ?? REGIONS[0]);
  const [editDistrict, setEditDistrict] = useState(district ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, region: editRegion, district: editDistrict }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Xatolik");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[14px] font-bold text-[var(--brand-ink)] shadow-sm active:scale-[0.98]"
      >
        <Pencil size={15} /> Ma&apos;lumotlarni tahrirlash
      </button>
    );
  }

  return (
    <section className="ios-card mt-3 space-y-3 p-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
          Ism
        </label>
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Ismingiz"
          maxLength={120}
          className="ios-input"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
          Hudud
        </label>
        <select
          value={editRegion}
          onChange={(e) => setEditRegion(e.target.value)}
          className="ios-input appearance-none"
        >
          {REGIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
          Tuman (ixtiyoriy)
        </label>
        <input
          value={editDistrict}
          onChange={(e) => setEditDistrict(e.target.value)}
          placeholder="Masalan: Chilonzor"
          maxLength={120}
          className="ios-input"
        />
      </div>
      {error && (
        <p className="rounded-2xl bg-[var(--brand-red-soft)] p-2.5 text-[12.5px] font-semibold text-[#d7263d]">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="ios-btn flex flex-1 items-center justify-center"
        >
          {busy ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
          Saqlash
        </button>
        <button
          onClick={() => setOpen(false)}
          className="ios-btn secondary flex items-center justify-center px-4"
          aria-label="Bekor qilish"
        >
          <X size={17} />
        </button>
      </div>
    </section>
  );
}
