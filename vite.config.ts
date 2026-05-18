import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: { port: 5180, open: true },
  build: {
    // three.js + react-globe.gl are large; isolate them so the browser
    // caches the 3D vendor bundle across deploys (app code changes more
    // often than the globe engine).
    chunkSizeWarningLimit: 1900,
    rollupOptions: {
      output: {
        manualChunks: {
          'globe-vendor': ['three', 'react-globe.gl'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
