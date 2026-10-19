import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone rejim: backend API'ga ulanmaydi.
export default defineConfig({
  plugins: [react()],
  server: { port: 3002 },
});

