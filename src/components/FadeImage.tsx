"use client";

/**
 * FadeImage — sekin tarmoqlarda rasm chiroyli ko'rinishi uchun:
 *
 * • Yuklanish paytida — mavjud `.skeleton` shimmer effekti (globals.css)
 * • Yuklangach — 400ms da yumshoq fade-in
 * • Xatolik bo'lsa (masalan, rasm o'chirilgan) — fallback node qoladi
 * • Keshlangan rasm brauzerda allaqachon yuklangan bo'lsa ham `complete`
 *   xususiyati orqali darhol ko'rsatiladi (onLoad o'tmagan holat uchun)
 *
 * Konteyner o'lchami `className` orqali beriladi (masalan, `aspect-[4/1]`).
 */

import { useCallback, useState, type ReactNode } from "react";

export default function FadeImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  /** Konteyner (o'lcham, radius) klasslari. */
  className?: string;
  /** Rasm yuklanmagan/xato bo'lsa ko'rsatiladigan vaznli element. */
  fallback?: ReactNode;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");

  // Rasm keshdan darhol yuklangan bo'lsa onLoad o'tmasligi mumkin —
  // ref callback orqali `complete` holatini tekshiramiz.
  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth > 0) {
      setState("loaded");
    }
  }, []);

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {state !== "loaded" && (
        <div className="absolute inset-0" aria-hidden="true">
          {state === "error" ? (
            fallback
          ) : (
            <div className="skeleton h-full w-full" />
          )}
        </div>
      )}
      {state !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          className={`h-full w-full object-cover transition-opacity duration-400 motion-reduce:transition-none ${
            state === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
