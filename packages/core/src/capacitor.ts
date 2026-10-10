import { apiFetch } from "./api-config";

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

export async function initNativeApp(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#15803d" });
  } catch (e) {
    console.debug("[Capacitor] StatusBar init skipped:", e);
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.debug("[Capacitor] SplashScreen hide skipped:", e);
  }

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === "granted" || (await PushNotifications.checkPermissions()).receive === "granted") {
      await PushNotifications.register();

      PushNotifications.addListener("registration", (token) => {
        try {
          localStorage.setItem("agroz_push_token", token.value);
          registerPushTokenOnBackend(token.value).catch(() => {});
        } catch {}
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

export async function registerPushTokenOnBackend(tokenValue?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  let token = tokenValue;
  if (!token) {
    try {
      token = localStorage.getItem("agroz_push_token") || undefined;
    } catch {}
  }
  if (!token) return false;

  try {
    const res = await apiFetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

export async function unregisterPushTokenOnBackend(): Promise<void> {
  if (typeof window === "undefined") return;
  let token: string | null = null;
  try {
    token = localStorage.getItem("agroz_push_token");
  } catch {}
  if (!token) return;

  try {
    await apiFetch("/api/push/unregister", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    /* ignore */
  } finally {
    try {
      localStorage.removeItem("agroz_push_token");
    } catch {}
  }
}

export async function takeNativePhoto(): Promise<string | null> {
  if (!isNativeApp()) return null;

  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
    });
    return image.dataUrl || null;
  } catch (e) {
    console.warn("[Capacitor] Camera capture canceled or error:", e);
    return null;
  }
}

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
