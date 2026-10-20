import React, { useState } from 'react';
import { Send, Phone, Mail, MapPin, CheckCircle2, Store, Clock, MessageSquare } from 'lucide-react';
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
  const [form, setForm] = useState({ name: '', phone: '', role: 'Fermer', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const phoneDigits = (p: string) => p.replace(/\D/g, '').replace(/^998/, '');

  const submitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Ismingizni kiriting');
    if (phoneDigits(form.phone).length < 9) return setError('Telefon raqamini to‘liq kiriting');
    setError('');
    setSent(true);
  };

  return (
    <section id="contact" className="pb-16 sm:pb-24">
      <div className="container-x grid gap-6 lg:grid-cols-2">
        {/* Chap: To'g'ridan-to'g'ri Bog'lanish Ma'lumotlari */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-forest-dark border border-forest-border p-6 text-white shadow-soft sm:p-10 scroll-mt-28">
          <AgroImage
            src={IMAGES.hero}
            alt=""
            className="absolute inset-0 h-full w-full opacity-15 object-cover mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-forest-dark via-forest-dark/95 to-forest-dark/75" />

          {/* Fon yorug'ligi */}
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-agroGreen/20 blur-3xl" />
          <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-agroGreen/15 blur-2xl" />

          <div className="relative z-10">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-agroGreen px-3.5 py-1.5 text-xs font-bold text-forest-dark shadow-glow-subtle">
              <Phone className="h-3.5 w-3.5" /> To‘g‘ridan-to‘g‘ri aloqa
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
              Savolingiz bormi? <br />
              <span className="text-agroGreen">Biz bilan bog‘laning</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              AgrozGO agro-marketplacesi bo‘yicha savollar, takliflar yoki hamkorlik uchun quyidagi rasmiy aloqa vositalari orqali murojaat qilishingiz mumkin.
            </p>

            {/* Aloqa Kartochkalari */}
            <div className="mt-8 space-y-3">
              {/* Telefon */}
              <a
                href={`tel:${CONTACT_INFO.phoneRaw}`}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10 hover:border-agroGreen/40 group"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-agroGreen/20 text-agroGreen group-hover:scale-105 transition-transform">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Telefon raqam</p>
                  <p className="text-lg font-bold text-white group-hover:text-agroGreen transition">
                    {CONTACT_INFO.phone}
                  </p>
                  <p className="text-[11px] text-white/60">Har kuni 08:00 – 20:00 (Qo‘ng‘iroqlar uchun)</p>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10 hover:border-agroGreen/40 group"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-agroGreen/20 text-agroGreen group-hover:scale-105 transition-transform">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Elektron pochta</p>
                  <p className="text-lg font-bold text-white group-hover:text-agroGreen transition">
                    {CONTACT_INFO.email}
                  </p>
                  <p className="text-[11px] text-white/60">Rasmiy xatlar, takliflar va murojaatlar</p>
                </div>
              </a>

              {/* Manzil */}
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-agroGreen/20 text-agroGreen">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Manzil</p>
                  <p className="text-base font-bold text-white">{CONTACT_INFO.address}</p>
                  <p className="text-[11px] text-white/60">O‘zbekiston bo‘ylab agro-tarmoq</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-agroGreen" /> {CONTACT_INFO.workingHours}
            </span>
            <span className="font-semibold text-agroGreen">Tezkor javob kafolati</span>
          </div>
        </div>

        {/* O'ng: Aloqa va Murojaat Formasi */}
        <div className="relative overflow-hidden rounded-3xl bg-white/95 shadow-card border border-charcoal/5 p-6 backdrop-blur-sm sm:p-10 flex flex-col justify-between">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-agroGreen/10 blur-3xl" />
          <div>
            <Eyebrow>Xabar qoldirish</Eyebrow>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight sm:text-3xl text-charcoal">
              Murojaat yuboring <span className="font-semibold text-charcoal/50">— tezda bog‘lanamiz.</span>
            </h2>

            {sent ? (
              <div className="mt-8 rounded-2xl bg-agroGreen-50 border border-agroGreen/20 p-6">
                <CheckCircle2 className="h-8 w-8 text-agroGreen-dark" />
                <p className="mt-3 text-lg font-bold text-forest-dark">Xabaringiz qabul qilindi!</p>
                <p className="mt-1 text-sm text-charcoal/65">Tez orada mutaxassislarimiz {form.phone} raqamiga bog‘lanadi.</p>
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
                  placeholder="Qanday masalada murojaat qilmoqchisiz?.."
                  aria-label="Xabar"
                  className="w-full resize-none rounded-xl border border-charcoal/10 bg-cream px-4 py-3 text-sm outline-none transition focus:border-agroGreen focus:ring-2 focus:ring-agroGreen/20"
                />
                {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
                <button type="submit" className="btn-dark group">
                  Xabarni yuborish
                  <span className="btn-dark-icon">
                    <Send className="h-4 w-4" />
                  </span>
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 grid gap-3 border-t border-charcoal/10 pt-6 text-sm sm:grid-cols-2">
            <a
              href={`tel:${CONTACT_INFO.phoneRaw}`}
              className="flex items-center gap-2 text-charcoal/80 hover:text-agroGreen-dark font-semibold transition"
            >
              <Phone className="h-4 w-4 text-agroGreen" /> {CONTACT_INFO.phone}
            </a>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="flex items-center gap-2 text-charcoal/80 hover:text-agroGreen-dark font-semibold transition"
            >
              <Mail className="h-4 w-4 text-agroGreen" /> {CONTACT_INFO.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Footer: React.FC = () => (
  <footer className="bg-forest-dark border-t border-forest-border text-white relative overflow-hidden">
    {/* Pre-footer Banner */}
    <div className="container-x pt-16">
      <div className="relative overflow-hidden rounded-[36px] bg-forest-card border border-forest-border p-8 sm:p-14 text-center shadow-2xl">
        <AgroImage
          src={IMAGES.aerial}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/85 to-forest-dark/60" />

        <div className="relative max-w-2xl mx-auto flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-agroGreen/20 border border-agroGreen/30 px-4 py-1.5 text-xs font-black text-agroGreen">
            ✦ Ishonchli Agro-Ta‘minot
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            AgrozGO bilan agro-biznesingizni <br />
            rivojlantiring
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/70 max-w-lg leading-relaxed">
            Sifat nazorati, shaffof narxlar va ishonchli xarid — AgrozGO bosh tamoyillari.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={`tel:${CONTACT_INFO.phoneRaw}`}
              className="inline-flex items-center gap-2 rounded-full bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-extrabold px-6 py-3 text-sm transition shadow-glow-green cursor-pointer active:scale-95"
            >
              <Phone className="h-4 w-4" /> {CONTACT_INFO.phone}
            </a>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold px-6 py-3 text-sm transition border border-white/20 cursor-pointer"
            >
              <Mail className="h-4 w-4 text-agroGreen" /> {CONTACT_INFO.email}
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Asosiy Footer Linklari */}
    <div className="container-x grid gap-10 py-16 md:grid-cols-12 relative z-10">
      <div className="md:col-span-5">
        <Logo light />
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
          Fermer, chorvador va dehqonlar uchun yagona agro-marketplace platformasi.
        </p>
      </div>
      <div className="md:col-span-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Bo‘limlar</p>
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
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Bog‘lanish</p>
        <p className="mt-4 text-sm text-white/60">Savollar va takliflar uchun rasmiy aloqa markazi:</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-white/80">
          <a href={`tel:${CONTACT_INFO.phoneRaw}`} className="hover:text-agroGreen transition flex items-center gap-2 font-bold text-white">
            <Phone className="h-4 w-4 text-agroGreen" /> {CONTACT_INFO.phone}
          </a>
          <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-agroGreen transition flex items-center gap-2 font-semibold">
            <Mail className="h-4 w-4 text-agroGreen" /> {CONTACT_INFO.email}
          </a>
          <span className="flex items-center gap-2 text-xs text-white/50">
            <MapPin className="h-3.5 w-3.5 text-agroGreen" /> {CONTACT_INFO.address}
          </span>
        </div>
        <a
          href={BIZNESGO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-agroGreen px-4 py-2.5 text-xs font-extrabold text-forest-dark hover:bg-agroGreen-hover shadow-glow-subtle transition"
        >
          <Store className="h-4 w-4" /> biznesgo.uz
        </a>
      </div>
    </div>

    {/* Footer mualliflik huquqi */}
    <div className="border-t border-white/5 py-6">
      <div className="container-x flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
        <span>© {new Date().getFullYear()} AgrozGO. Barcha huquqlar himoyalangan.</span>
        <span>info@biznesgo.uz | +998 90 838 37 72</span>
      </div>
    </div>
  </footer>
);
