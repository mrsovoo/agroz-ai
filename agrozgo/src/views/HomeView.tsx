import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { About } from '../components/About';
import { Sectors } from '../components/Sectors';
import { Quality, Values } from '../components/Quality';
import { AppAndContact, Footer } from '../components/Contact';

/** AgrozGO (B2C) taqdimot sahifasi — Standalone rejim, barcha ma'lumotlar statik. */
export const HomeView: React.FC = () => (
  <div className="min-h-screen bg-cream">
    <Header />
    <main>
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

