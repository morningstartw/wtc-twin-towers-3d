import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
