import type { ReactNode } from "react";

/**
 * Kabinet (partner mini app) uchun maxsus layout.
 *
 * Root layout (layout.tsx) consumer ilovaning barcha komponentlarini
 * (BottomNav, WebTopNav, CartDrawer, WebFooter, MobileSwipeNavigation)
 * render qiladi. Lekin /kabinet sahifasi — hamkor kabineti.
 * U alohida mini app bo'lib, consumer navigatsiyasiz ko'rsatilishi kerak.
 *
 * Next.js nested layout orqali biz bu sahifani consumer shelldan ajratamiz.
 * Root layout body/html ni beradi, bu layout esa faqat childni qaytaradi.
 * Consumer komponentlari root layoutda turadi, lekin ularni yashiramiz
 * CSS yordamida: /kabinet route uchun .kabinet-shell klassi qo'yiladi.
 */
export default function KabinetLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* CSS orqali consumer UI elementlarini yashiramiz */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Kabinet ochilganda consumer navigation yashiriladi */
            .mobile-bottom-nav,
            .web-top-nav,
            .web-footer,
            [data-cart-drawer],
            [data-swipe-nav] {
              display: none !important;
            }
            /* app-shell padding/margin tozalash */
            .app-shell {
              padding-bottom: 0 !important;
            }
          `,
        }}
      />
      {children}
    </>
  );
}
