"use client";

import { useEnvironment } from "@/lib/env";
import DesktopComingSoon from "./coming-soon/DesktopComingSoon";
import PhoneTelegramPrompt from "./PhoneTelegramPrompt";
import { ReactNode, useEffect, useState } from "react";

export default function EnvWrapper({ children }: { children: ReactNode }) {
  const env = useEnvironment(false); // frontend is not admin
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !env) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f2f3f5]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (env === "desktop") {
    return <DesktopComingSoon type="frontend" />;
  }
  
  if (env === "phone") {
    return <PhoneTelegramPrompt type="frontend" />;
  }

  // Telegram - render normal layout
  return <>{children}</>;
}
