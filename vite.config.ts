import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from "vite-plugin-pwa";
import path from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: "autoUpdate",
  
    manifest: {
      id: "/",
  
      name: "Jib-be-Jib",
  
      short_name: "Jib",
  
      description: "Trip expense manager",
  
      start_url: "/",
  
      display: "standalone",
  
      theme_color: "#000000",
  
      background_color: "#ffffff",
  
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        }
      ],
  
      screenshots: [
        {
          src: "/screenshots/desktop.png",
          sizes: "1280x720",
          type: "image/png",
          form_factor: "wide"
        },
        {
          src: "/screenshots/mobile.png",
          sizes: "390x844",
          type: "image/png"
        }
      ]
    }
  }), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      }
    }
  }
});