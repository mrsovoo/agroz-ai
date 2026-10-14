"use client";

import { ReactNode } from "react";

export default function EnvWrapper({ children }: { children: ReactNode }) {
  // Web brauzer (Desktop & Mobil) va Telegram uchun ochiq (BETA)
  return <>{children}</>;
}
