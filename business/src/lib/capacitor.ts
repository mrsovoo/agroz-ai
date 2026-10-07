"use client";

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform());
}

export function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (window as any).Capacitor;
  if (!cap || typeof cap.getPlatform !== "function") return "web";
  return cap.getPlatform();
}

