import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Sectors } from '../components/Sectors';
import { Products } from '../components/Products';
import { OrderFlow } from '../components/OrderFlow';
import { Technology } from '../components/Technology';
import { About } from '../components/About';
import { Quality } from '../components/Quality';
import { Articles } from '../components/Articles';
import { AppAndContact, Footer } from '../components/Contact';

/**
 * AgrozGO (B2C) taqdimot sahifasi — Zamonaviy Agro-Tech uslubida (Referens dizayn 1:1)
 * Barcha takrorlanuvchi qismlar tozalangan, har bir blok o'ziga xos aniq vazifani bajaradi.
 */
export const HomeView: React.FC = () => (
  <div className="relative min-h-screen bg-cream overflow-x-hidden selection:bg-agroGreen/20 selection:text-forest-dark font-sans">
    {/* Atmosferik nozik brend nurlari (Warm Sun Wheat Glows) */}
    <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[900px] rounded-full bg-gradient-to-b from-agroGreen/10 via-agroGreen/5 to-transparent blur-3xl" />
    <div className="pointer-events-none fixed top-1/3 -left-48 h-[600px] w-[600px] rounded-full bg-agroGreen/5 blur-[120px]" />
    <div className="pointer-events-none fixed top-2/3 -right-48 h-[600px] w-[600px] rounded-full bg-agroGreen/5 blur-[120px]" />

    <Header />
    <main className="relative z-10 space-y-6 sm:space-y-10">
      <Hero />
      <Sectors />
      <Products />
      <OrderFlow />
      <Technology />
      <About />
      <Quality />
      <Articles />
      <AppAndContact />
    </main>
    <Footer />
  </div>
);
