import { apiFetch } from "@/lib/api-config";
"use client";

/**
 * AgrozGO Capacitor Native Bridge
 * Barcha native xususiyatlar (StatusBar, SplashScreen, Push Notifications, Camera, Geolocation)
 * xavfsiz tarzda (SSR-friendly) shu yerda jamlangan.
 */

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

/**
 * Ilova ishga tushganda native sozlamalarni faollashtirish
 */
export async function initNativeApp(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    // 1. Status Bar sozlash
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#15803d" });
  } catch (e) {
    console.debug("[Capacitor] StatusBar init skipped:", e);
  }

  try {
    // 2. Splash Screen yashirish
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.debug("[Capacitor] SplashScreen hide skipped:", e);
  }

  try {
    // 3. Push Notifications so'rash va ro'yxatdan o'tkazish
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === "granted" || (await PushNotifications.checkPermissions()).receive === "granted") {
      await PushNotifications.register();

      PushNotifications.addListener("registration", (token) => {
        console.log("[Capacitor] Push registration token:", token.value);
        if (typeof window !== "undefined") {
          localStorage.setItem("agroz_push_token", token.value);
          registerPushTokenOnBackend(token.value).catch(() => {});
        }
      });

      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        console.log("[Capacitor] Notification received:", notification);
      });

      PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        console.log("[Capacitor] Notification action:", action);
      });
    }
  } catch (e) {
    console.debug("[Capacitor] PushNotifications init skipped:", e);
  }
}

/**
 * Push tokenni serverga ro'yxatdan o'tkazish
 */
export async function registerPushTokenOnBackend(tokenValue?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const token = tokenValue || localStorage.getItem("agroz_push_token");
  if (!token) return false;

  try {
    const res = await apiFetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        token,
        platform: getPlatform(),
      }),
    });
    return res.ok;
  } catch (e) {
    console.debug("[Capacitor] Push register to server failed:", e);
    return false;
  }
}

/**
 * Chiqishda yoki hisob o'chirilganda push tokenni serverdan o'chirish
 */
export async function unregisterPushTokenOnBackend(): Promise<void> {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("agroz_push_token");
  if (!token) return;

  try {
    await apiFetch("/api/push/unregister", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });
  } catch (e) {
    /* ignore */
  } finally {
    localStorage.removeItem("agroz_push_token");
  }
}

/**
 * Native kamera orqali rasmga olish yoki galereyadan tanlash
 */
export async function takeNativePhoto(): Promise<string | null> {
  if (!isNativeApp()) return null;

  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // Foydalanuvchiga Kamera yoki Galereya tanlashni taklif qiladi
    });
    return image.dataUrl || null;
  } catch (e) {
    console.warn("[Capacitor] Camera capture canceled or error:", e);
    return null;
  }
}

/**
 * Native GPS orqali aniq koordinatalarni olish
 */
export async function getNativeLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (!isNativeApp()) return null;

  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (e) {
    console.warn("[Capacitor] Geolocation error:", e);
    return null;
  }
}
