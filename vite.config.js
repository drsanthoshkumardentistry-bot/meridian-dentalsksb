import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Big libraries get their own files so the browser can cache them between releases
// and pages that do not need them (patient links, legal pages) do not download them.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
