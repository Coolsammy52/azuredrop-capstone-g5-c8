// Vite config: React plugin only. CORS is open on the backend, so no dev proxy is needed.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
