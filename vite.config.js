import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/paoku-astra/' : '/',
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
});
