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
    modulePreload: true,
    reportCompressedSize: false,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('framer-motion')) {
              return 'vendor-ui-motion';
            }
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('html2pdf') || id.includes('xlsx')) {
              return 'vendor-docs';
            }
            if (id.includes('@supabase') || id.includes('firebase')) {
              return 'vendor-db';
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
