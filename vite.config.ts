import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@firebase/auth': path.resolve(__dirname, './node_modules/@firebase/auth/dist/esm/index.js'),
      '@firebase/util': path.resolve(__dirname, './node_modules/@firebase/util/dist/index.esm2017.js'),
      'phaser': path.resolve(__dirname, './node_modules/.phaser-N1yatjUG/dist/phaser.js'),
    },
    dedupe: ['firebase', '@firebase/app', '@firebase/auth', '@firebase/firestore'],
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'phaser'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  },
});
