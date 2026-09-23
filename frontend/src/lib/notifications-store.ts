export type NotificationType = "weather" | "crop" | "animal" | "order" | "system";
export type NotificationSeverity = "critical" | "warning" | "info" | "success";

export type AppNotification = {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  dateText: string;
  timestamp: number;
  region?: string;
};

const READ_STORAGE_KEY = "agroz:notifications:read_ids";
const LAST_READ_STORAGE_KEY = "agroz:notifications:last_read_at";
export const NOTIFICATIONS_EVENT = "agroz:notifications_updated";

/**
 * Mahalliy xotiradan o'qilgan bildirishnoma ID larini olish
 */
export function getReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * Bildirishnoma o'qilganligini tekshirish
 */
export function isNotificationRead(id: string): boolean {
  return getReadNotificationIds().has(id);
}

/**
 * Muayyan bildirishnomalarni o'qilgan deb belgilash
 */
export function markNotificationsRead(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const current = getReadNotificationIds();
    ids.forEach((id) => current.add(id));
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(current)));
    localStorage.setItem(LAST_READ_STORAGE_KEY, Date.now().toString());
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
  } catch (e) {
    console.error("markNotificationsRead error:", e);
  }
}

/**
 * Barcha bildirishnomalarni o'qilgan deb belgilash
 */
export function markAllNotificationsRead(notifications: AppNotification[]): void {
  markNotificationsRead(notifications.map((n) => n.id));
}

/**
 * O'qilmagan bildirishnomalar sonini hisoblash
 */
export function countUnreadNotifications(notifications: AppNotification[]): number {
  const readSet = getReadNotificationIds();
  return notifications.filter((n) => !readSet.has(n.id)).length;
}

/**
 * Bildirishnomalar o'zgarishini tinglash
 */
export function subscribeToNotificationChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(NOTIFICATIONS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(NOTIFICATIONS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * Real ob-havo, mavsum va tizim ma'lumotlari asosida bildirishnomalar to'plamini shakllantirish
 */
export async function fetchRealAppNotifications(userRegion: string = "Toshkent"): Promise<AppNotification[]> {
  const items: AppNotification[] = [];
  const now = Date.now();

  try {
    // 1. Real ob-havo ogohlantirishlarini tekshirish
    const alertsRes = await fetch(`/api/weather/alerts?region=${encodeURIComponent(userRegion)}`).catch(() => null);
    if (alertsRes && alertsRes.ok) {
      const data = await alertsRes.json();
      if (data?.ok && Array.isArray(data.alerts) && data.alerts.length > 0) {
        for (const alert of data.alerts) {
          items.push({
            id: `alert-${alert.id || alert.type}-${userRegion}`,
            type: "weather",
            severity: alert.severity === "critical" ? "critical" : "warning",
            title: alert.title,
            body: `${alert.subtitle} ${alert.description || ""}`.trim(),
            dateText: alert.dateText || "Bugun",
            timestamp: now - 15 * 60 * 1000,
            region: alert.region,
          });
        }
      }
    }
  } catch {
    // weather alerts fallback
  }

  try {
    // 2. Hozirgi aniq ob-havo ko'rsatkichlari (shamol, yog'in, harorat)
    const weatherRes = await fetch(`/api/weather`).catch(() => null);
    if (weatherRes && weatherRes.ok) {
      const w = await weatherRes.json();
      if (typeof w?.wind === "number") {
        if (w.wind >= 5) {
          items.push({
            id: `weather-wind-now-${new Date().toISOString().slice(0, 10)}`,
            type: "weather",
            severity: "warning",
            title: `💨 Kuchli shamol ogohlantirishi (${w.wind} m/s)`,
            body: `Shamol tezligi ${w.wind} m/s bo'lgani sababli kimyoviy preparatlar purkash tavsiya etilmaydi. Dori shamolda tarqab samarasiz bo'ladi.`,
            dateText: "Hozirgi holat",
            timestamp: now - 30 * 60 * 1000,
            region: userRegion,
          });
        } else if (w.rain > 0.2) {
          items.push({
            id: `weather-rain-now-${new Date().toISOString().slice(0, 10)}`,
            type: "weather",
            severity: "warning",
            title: `🌧️ Yog'ingarchilik kuzatilmoqda (${w.rain} mm)`,
            body: `Barglar ho'lligi sababli o'g'it va dorilashni to'xtating, preparatlar yomg'ir suvi bilan yuvilib ketadi.`,
            dateText: "Hozirgi holat",
            timestamp: now - 45 * 60 * 1000,
            region: userRegion,
          });
        } else {
          // Qulay ob-havo
          items.push({
            id: `weather-favorable-${new Date().toISOString().slice(0, 10)}`,
            type: "weather",
            severity: "success",
            title: `🌱 Dala ishlari va dori purkash uchun qulay fursat`,
            body: `Harorat ${w.temp}°C, shamol ${w.wind} m/s. Ekinlarni zararkunandalarga qarshi ishlov berish va oziqlantirish uchun ayni mos vaqt.`,
            dateText: "Bugungi tavsiya",
            timestamp: now - 60 * 60 * 1000,
            region: userRegion,
          });
        }
      }
    }
  } catch {
    // weather fallback
  }

  // 3. Mavsumiy agrotexnika va veterinariya maslahatlari
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 8 && month <= 11) {
    // Kuzgi mavsum
    items.push(
      {
        id: `season-crop-autumn-${month}`,
        type: "crop",
        severity: "info",
        title: "🌾 Kuzgi shudgor va mevali bog'larni parvarishlash",
        body: "Hosil yig'ishtirilgach, daraxt tanalarini oqlash, quruq shoxlarni kesish va tuproqqa fosforli-kaliyli o'g'it solish lozim.",
        actionUrl: "/dorilar",
        actionLabel: "Dorilar katalogi",
        dateText: "Mavsumiy agrotexnika",
        timestamp: now - 3 * 3600 * 1000,
      },
      {
        id: `season-animal-autumn-${month}`,
        type: "animal",
        severity: "info",
        title: "🐄 Chorva mollarni sovuqqa tayyorlash va profilaktik emlash",
        body: "Kuzda havo harorati o'zgarishi sababli qoramol va qo'ylarda nafas yo'li kasalliklari ko'payadi. Molxona tirqishlarini yopib, quruq to'shama soling.",
        actionUrl: "/mutaxassislar",
        actionLabel: "Veterinarlar",
        dateText: "Veterinariya eslatmasi",
        timestamp: now - 6 * 3600 * 1000,
      },
    );
  } else if (month >= 3 && month <= 5) {
    // Bahor
    items.push(
      {
        id: `season-crop-spring-${month}`,
        type: "crop",
        severity: "info",
        title: "🌱 Bahorgi birinchi purkash va oziqlantirish",
        body: "Kurtak yorilishidan oldin zamburug' va zararkunandalarga qarshi fungitsid va insektitsid bilan profilaktik ishlov bering.",
        actionUrl: "/dorilar",
        actionLabel: "Dorilar katalogi",
        dateText: "Mavsumiy agrotexnika",
        timestamp: now - 3 * 3600 * 1000,
      },
      {
        id: `season-animal-spring-${month}`,
        type: "animal",
        severity: "info",
        title: "🐑 Bahorgi emlash va yaylovga chiqarish",
        body: "Chorvani birdaniga yangi ko'katga qo'ymang (kuchli sanchiq xavfi bor). Bosqichma-bosqich yaylovga o'tkazing.",
        actionUrl: "/mutaxassislar",
        actionLabel: "Veterinarlar",
        dateText: "Veterinariya eslatmasi",
        timestamp: now - 6 * 3600 * 1000,
      },
    );
  } else if (month >= 6 && month <= 8) {
    // Yoz
    items.push(
      {
        id: `season-crop-summer-${month}`,
        type: "crop",
        severity: "info",
        title: "☀️ Jazirama issiqda sug'orish tartibi",
        body: "Quyosh tig'ida sug'ormang. Sug'orishni kechki soatlarda yoki erta tongda tomchilatib amalga oshiring.",
        actionUrl: "/dorilar",
        actionLabel: "Dorilar katalogi",
        dateText: "Mavsumiy agrotexnika",
        timestamp: now - 3 * 3600 * 1000,
      },
      {
        id: `season-animal-summer-${month}`,
        type: "animal",
        severity: "info",
        title: "🐄 Chorvani issiqlik stressidan himoyalash",
        body: "Mollarni soya joyda saqlang, doimiy salqin toza suv va tuzli toshlar bilan ta'minlang.",
        actionUrl: "/mutaxassislar",
        actionLabel: "Veterinarlar",
        dateText: "Veterinariya eslatmasi",
        timestamp: now - 6 * 3600 * 1000,
      },
    );
  } else {
    // Qish
    items.push(
      {
        id: `season-crop-winter-${month}`,
        type: "crop",
        severity: "info",
        title: "❄️ Issiqxona va parniklarda haroratni nazorat qilish",
        body: "Issiqxonalarda harorat +16°C dan pasaymasligini ta'minlang, darchalarni shamollatish rejimida oching.",
        actionUrl: "/dorilar",
        actionLabel: "Dorilar katalogi",
        dateText: "Mavsumiy agrotexnika",
        timestamp: now - 3 * 3600 * 1000,
      },
      {
        id: `season-animal-winter-${month}`,
        type: "animal",
        severity: "info",
        title: "🐂 Qishki to'yimli ratsion va issiq to'shama",
        body: "Mollarga muzlagan suv bermang. Ozuqa konsentratsiyasini oshirib, polga qalin somon to'shang.",
        actionUrl: "/mutaxassislar",
        actionLabel: "Veterinarlar",
        dateText: "Veterinariya eslatmasi",
        timestamp: now - 6 * 3600 * 1000,
      },
    );
  }

  // 4. Agroz AI tizimi xabarnomasi
  items.push({
    id: "system-status-welcome",
    type: "system",
    severity: "info",
    title: "📱 Agroz AI xizmatlari faol",
    body: "Dorilar yetkazib berish, veterinarlar va agronomlar chaqiruvi hamda sun'iy intellekt agro-tashxisi 24/7 ishlamoqda.",
    dateText: "Tizim xabari",
    timestamp: now - 24 * 3600 * 1000,
  });

  return items;
}
