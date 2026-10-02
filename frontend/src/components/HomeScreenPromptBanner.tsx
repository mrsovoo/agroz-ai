"use client";

/**
 * AgrozGO hozirda App Store va Google Play uchun to'liq native mobil ilova (Capacitor)
 * shaklida chiqarilganligi sababli PWA "Bosh ekranga qo'shish" banneri o'chirildi.
 */

export async function triggerEasyHomeScreenAdd(): Promise<"native_triggered" | "show_guide"> {
  return "native_triggered";
}

export function HomeScreenGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return null;
}

export function AddToHomeScreenButton({ variant = "header" }: { variant?: "header" | "profile" }) {
  return null;
}

export default function HomeScreenPromptBanner() {
  return null;
}
