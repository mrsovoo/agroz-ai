import React, { useState } from 'react';
import { Smartphone, Bell, Send, Phone, Mail, MapPin, CheckCircle2, Store } from 'lucide-react';
import { Logo, Eyebrow, AgroImage } from './ui';
import { IMAGES, NAV_LINKS, BIZNESGO_URL, CONTACT_INFO } from '../data/content';

const formatUzPhone = (value: string) => {
  let d = value.replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  if (!d) return '+998 ';
  let r = '+998 ' + d.slice(0, 2);
  if (d.length > 2) r += ' ' + d.slice(2, 5);
  if (d.length > 5) r += ' ' + d.slice(5, 7);
  if (d.length > 7) r += ' ' + d.slice(7, 9);
  return r;
};

export const AppAndContact: React.FC = () => {
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notified, setNotified] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', role: 'Fermer', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const phoneDigits = (p: string) => p.replace(/\D/g, '').replace(/^998/, '');

  const submitNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneDigits(notifyPhone).length < 9) return;
    setNotified(true);
  };

  // Standalone: forma faqat klientda tasdiqlanadi (backend'ga yuborilmaydi).
  const submitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Ismingizni kiriting');
    if (phoneDigits(form.phone).length < 9) return setError('Telefon raqamini to‘liq kiriting');
    setError('');
    setSent(true);
  };

  return (
    <section id="contact" className="pb-16 sm:pb-24">
      <div className="container-x grid gap-4 lg:grid-cols-2">
        {/* Mobil ilova e'loni */}
        <div className="relative flex flex-col overflow-hidden rounded-3xl bg-forest-dark border border-forest-border p-6 text-white shadow-soft sm:p-10">
          <AgroImage src={IMAGES.hero} alt="" className="absolute inset-0 h-full w-full opacity-15 object-cover mix-blend-luminosity scale-105" />
          <div className="absolute inset-0 bg-gradient-to-br from-forest-dark via-forest-dark/95 to-forest-dark/75" />

          {/* Atmosferik zumrad nurlari */}
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-agroGreen/25 blur-3xl" />
          <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-agroGreen/15 blur-2xl" />

          <div className="relative flex flex-1 flex-col">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-agroGreen px-3 py-1.5 text-xs font-bold text-forest-dark shadow-glow-subtle">
              <Smartphone className="h-4 w-4" /> Tez orada
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
              Tez orada AgrozGO <span className="text-agroGreen">mobil ilovasi</span> ishga tushadi
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              iOS, Android va Telegram Mini App ko‘rinishida. Ishga tushganda birinchilardan bo‘lib xabar olish uchun
              raqamingizni qoldiring.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {['App Store', 'Google Play', 'Telegram Mini App'].map((p) => (
                <span key={p} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85">
                  {p}
                </span>
              ))}
            </div>

            <div className="mt-auto pt-8">
              {notified ? (
                <p className="flex items-center gap-2 rounded-2xl bg-white/10 p-4 text-sm font-semibold border border-agroGreen/30">
                  <CheckCircle2 className="h-5 w-5 text-agroGreen" /> Rahmat! Ilova ishga tushganda xabar beramiz.
                </p>
              ) : (
                <form onSubmit={submitNotify} className="flex flex-col gap-2 rounded-2xl bg-white p-2 sm:flex-row sm:rounded-full shadow-lg">
                  <input
                    type="tel"
                    value={notifyPhone}
                    onFocus={() => !notifyPhone && setNotifyPhone('+998 ')}
                    onChange={(e) => setNotifyPhone(formatUzPhone(e.target.value))}
                    placeholder="+998 90 000 00 00"
                    aria-label="Telefon raqami"
                    className="flex-1 bg-transparent px-4 py-2.5 text-sm font-semibold text-charcoal outline-none placeholder:font-normal placeholder:text-charcoal/40"
                  />
                  <button
                    type="submit"
                    disabled={phoneDigits(notifyPhone).length < 9}
                    className="flex items-center justify-center gap-2 rounded-full bg-agroGreen px-5 py-2.5 text-sm font-bold text-forest-dark transition hover:bg-agroGreen-hover shadow-glow-subtle disabled:opacity-50"
                  >
                    <Bell className="h-4 w-4" /> Xabar berish
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Aloqa formasi */}
        <div className="relative overflow-hidden rounded-3xl bg-white/95 shadow-card border border-charcoal/5 p-6 backdrop-blur-sm sm:p-10">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-agroGreen/10 blur-3xl" />
          <Eyebrow>Bog‘lanish</Eyebrow>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight sm:text-3xl">
            Savol yoki taklifingiz bormi? <span className="font-semibold text-charcoal/50">Yozing.</span>
          </h2>

          {sent ? (
            <div className="mt-8 rounded-2xl bg-agroGreen-50 border border-agroGreen/20 p-6">
              <CheckCircle2 className="h-8 w-8 text-agroGreen-dark" />
              <p className="mt-3 text-lg font-bold text-forest-dark">Xabaringiz qabul qilindi!</p>
              <p className="mt-1 text-sm text-charcoal/65">Tez orada {form.phone} raqamiga bog‘lanamiz.</p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setForm({ name: '', phone: '', role: 'Fermer', message: '' });
                }}
                className="mt-4 text-sm font-semibold text-agroGreen-dark underline hover:text-agroGreen-700"
              >
                Yana yozish
              </button>
            </div>
          ) : (
            <form onSubmit={submitContact} className="mt-6 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ismingiz"
                  aria-label="Ismingiz"
                  className="w-full rounded-xl border border-charcoal/10 bg-cream px-4 py-3 text-sm outline-none transition focus:border-agroGreen focus:ring-2 focus:ring-agroGreen/20"
                />
                <input
                  type="tel"
                  value={form.phone}
                  onFocus={() => !form.phone && setForm({ ...form, phone: '+998 ' })}
                  onChange={(e) => setForm({ ...form, phone: formatUzPhone(e.target.value) })}
                  placeholder="+998 90 000 00 00"
                  aria-label="Telefon raqami"
                  className="w-full rounded-xl border border-charcoal/10 bg-cream px-4 py-3 text-sm font-semibold outline-none transition focus:border-agroGreen focus:ring-2 focus:ring-agroGreen/20"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['Fermer', 'Chorvador', 'Dehqon', 'Do‘kon egasi'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      form.role === r
                        ? 'bg-forest-dark text-white ring-1 ring-agroGreen/40 shadow-sm'
                        : 'bg-beige text-charcoal/70 hover:bg-agroGreen-50 hover:text-agroGreen-dark'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Xabaringiz..."
                aria-label="Xabar"
                className="w-full resize-none rounded-xl border border-charcoal/10 bg-cream px-4 py-3 text-sm outline-none transition focus:border-agroGreen focus:ring-2 focus:ring-agroGreen/20"
              />
              {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
              <button type="submit" className="btn-dark group">
                Yuborish
                <span className="btn-dark-icon">
                  <Send className="h-4 w-4" />
                </span>
              </button>
            </form>
          )}

          <div className="mt-8 grid gap-3 border-t border-charcoal/10 pt-6 text-sm sm:grid-cols-3">
            <a href={`tel:${CONTACT_INFO.phoneRaw}`} className="flex items-center gap-2 text-charcoal/80 hover:text-agroGreen-dark font-medium transition">
              <Phone className="h-4 w-4 text-agroGreen" /> {CONTACT_INFO.phone}
            </a>
            <a href={`mailto:${CONTACT_INFO.email}`} className="flex items-center gap-2 text-charcoal/80 hover:text-agroGreen-dark font-medium transition">
              <Mail className="h-4 w-4 text-agroGreen" /> {CONTACT_INFO.email}
            </a>
            <span className="flex items-center gap-2 text-charcoal/75">
              <MapPin className="h-4 w-4 text-agroGreen" /> {CONTACT_INFO.address}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Footer: React.FC = () => (
  <footer className="bg-forest-dark border-t border-forest-border text-white">
    <div className="container-x grid gap-10 py-14 md:grid-cols-12">
      <div className="md:col-span-5">
        <Logo light />
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
          Fermer, chorvador va dehqonlar uchun yagona agro-marketplace. BiznesGO B2B ekotizimi asosida.
        </p>
      </div>
      <div className="md:col-span-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Sahifalar</p>
        <ul className="mt-4 space-y-2 text-sm">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-white/75 hover:text-agroGreen transition">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Do‘kon egalari uchun</p>
        <p className="mt-4 text-sm text-white/60">POS kassa, ombor va qarz daftarini BiznesGO’da yuriting.</p>
        <div className="mt-3 flex flex-col gap-1.5 text-xs text-white/70">
          <a href={`tel:${CONTACT_INFO.phoneRaw}`} className="hover:text-agroGreen transition">
            📞 {CONTACT_INFO.phone}
          </a>
          <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-agroGreen transition">
            ✉️ {CONTACT_INFO.email}
          </a>
        </div>
        <a
          href={BIZNESGO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-agroGreen px-4 py-2.5 text-sm font-bold text-forest-dark hover:bg-agroGreen-hover shadow-glow-subtle transition"
        >
          <Store className="h-4 w-4" /> biznesgo.uz
        </a>
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/40 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} AgrozGO. Barcha huquqlar himoyalangan.</span>
        <span>Ishlab chiqildi: BiznesGO jamoasi</span>
      </div>
    </div>
  </footer>
);

