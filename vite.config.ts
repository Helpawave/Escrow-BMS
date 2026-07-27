import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    modulePreload: false,
    reportCompressedSize: false,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('@radix-ui') ||
              id.includes('cmdk') ||
              id.includes('framer-motion')
            ) {
              return 'vendor-core';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('html2pdf')) {
              return 'vendor-pdf';
            }
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
          }
        }
      },
      onwarn(warning, warn) {
        // Suppress dynamic import warnings for jspdf/html2canvas
        if (warning.code === 'DYNAMIC_IMPORT_IN_STATIC_CHUNK' || warning.message.includes('dynamic import will not move module')) {
          return;
        }
        // Suppress annotation warnings like comments that Rollup cannot interpret
        if (warning.code === 'INVALID_ANNOTATION' || warning.message.includes('contains an annotation that Rollup cannot interpret')) {
          return;
        }
        // General warning delegation
        warn(warning);
      }
    }
  }
});
