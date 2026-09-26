import Link from "next/link";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-5 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-[22px] text-[var(--brand-ink)]"
        style={{ background: "var(--brand-yellow)" }}
      >
        <SearchX size={32} />
      </div>
      <h1 className="ios-title mt-4">Sahifa topilmadi</h1>
      <p className="mt-2 max-w-[320px] text-[15px] text-[var(--brand-muted)]">
        Siz izlagan sahifa o&apos;chirilgan yoki manzil xato kiritilgan bo&apos;lishi mumkin.
      </p>
      <Link href="/" className="mt-6 w-full max-w-[320px]">
        <button className="ios-btn">
          <Home size={18} /> Bosh sahifaga qaytish
        </button>
      </Link>
    </main>
  );
}
