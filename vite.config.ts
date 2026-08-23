import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const isE2E = mode === 'e2e';
  return {
    base: process.env.VITE_BASE ?? '/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            phaser: ['phaser'],
          },
        },
      },
    },
    define: {
      __PD_DEBUG_HOOKS__: JSON.stringify(isE2E),
    },
    server: {
      port: 5173,
    },
    preview: {
      port: 4173,
    },
  };
});
