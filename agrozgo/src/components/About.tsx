import React from 'react';
import { CentralAsiaMap } from './CentralAsiaMap';

/**
 * "Biz haqimizda & Mintaqaviy Qamrov"
 * O‘zbekiston va O‘rta Osiyo qamrovi, B2B do'konlar, B2C fermerlar,
 * savdo aylanmasi va 14 viloyat qamrovini ifodalovchi minimalist xarita.
 */
export const About: React.FC = () => {
  return (
    <section id="about" className="py-12 sm:py-16 bg-cream/50 border-b border-charcoal/5 scroll-mt-24">
      <div className="container-x">
        <CentralAsiaMap />
      </div>
    </section>
  );
};
