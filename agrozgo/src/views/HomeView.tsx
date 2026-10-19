import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { About } from '../components/About';
import { Sectors } from '../components/Sectors';
import { Quality, Values } from '../components/Quality';
import { AppAndContact, Footer } from '../components/Contact';

/** AgrozGO (B2C) taqdimot sahifasi — Standalone rejim, barcha ma'lumotlar statik. */
export const HomeView: React.FC = () => (
  <div className="relative min-h-screen bg-cream overflow-x-hidden selection:bg-agroGreen/20 selection:text-forest-dark">
    {/* Atmosferik nozik brend nurlari (Ambient Identity Glows) */}
    <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[900px] rounded-full bg-gradient-to-b from-agroGreen/10 via-agroGreen/5 to-transparent blur-3xl" />
    <div className="pointer-events-none fixed top-1/3 -left-48 h-[600px] w-[600px] rounded-full bg-agroGreen/5 blur-[120px]" />
    <div className="pointer-events-none fixed top-2/3 -right-48 h-[600px] w-[600px] rounded-full bg-agroGreen/5 blur-[120px]" />

    <Header />
    <main className="relative z-10">
      <Hero />
      <About />
      <Sectors />
      <Quality />
      <Values />
      <AppAndContact />
    </main>
    <Footer />
  </div>
);

