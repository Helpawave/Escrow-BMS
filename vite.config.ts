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
    chunkSizeWarningLimit: 3000,
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
              id.includes('framer-motion') ||
              id.includes('recharts') ||
              id.includes('chart.js') ||
              id.includes('react-chartjs-2')
            ) {
              return 'vendor-core';
            }
            if (id.includes('@supabase') || id.includes('firebase')) {
              return 'vendor-db';
            }
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('html2pdf') || id.includes('xlsx')) {
              return 'vendor-docs';
            }
            if (id.includes('lucide-react') || id.includes('date-fns') || id.includes('@tanstack')) {
              return 'vendor-utils';
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
