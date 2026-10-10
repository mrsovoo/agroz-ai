import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// APP_VARIANT = "user" | "business" (default: "user")
const appVariant = process.env.APP_VARIANT === "business" ? "business" : "user";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VARIANT__: JSON.stringify(appVariant),
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
