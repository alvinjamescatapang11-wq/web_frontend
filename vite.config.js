import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, frontendDirectory, '');
  const isVercel = process.env.VERCEL === '1';

  return {
    base: command === 'serve' || isVercel ? '/' : '/react/',
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      strictPort: true,
      proxy: {
        '/api': {
          target: env.LAVALUST_BACKEND_URL || 'http://127.0.0.1:8081',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '127.0.0.1',
      strictPort: true,
    },
    build: {
      outDir: isVercel
        ? path.resolve(frontendDirectory, 'dist')
        : path.resolve(frontendDirectory, '../LavaLust/public/react'),
      emptyOutDir: true,
    },
  };
});
