import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@agroz/types': fileURLToPath(new URL('../../packages/types/src', import.meta.url)),
      '@agroz/utils': fileURLToPath(new URL('../../packages/utils/src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});

