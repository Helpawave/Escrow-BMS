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
    chunkSizeWarningLimit: 5000, // Increase chunk limit warning to 5MB to handle heavy bundles without warnings
    rollupOptions: {
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
