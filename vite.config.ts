import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base relativa ("./") permite empacotar para GitHub Pages (subpastas),
  // Electron (file://), Capacitor nativo e servidores estáticos.
  base: "./",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: false,
      ignored: ["**/android/**", "**/ios/**", "**/*.csv", "**/*.xlsx", "**/*.xml", "**/new_penal_extracted/**", "**/xlsx.js", "**/dist/**", "**/build-assets/**", "**/.git/**", "**/public/laws-bundle/**"]
    },
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/App.tsx", "./src/AppRoutes.tsx", "./src/index.css"],
    },
  },
  plugins: [
    react(),
    // @vitejs/plugin-legacy removido: alvos suportados (Capacitor Android
    // WebView atual + Chrome/Safari/Firefox modernos) já entendem ES2020.
    // O plugin gerava um segundo build + polyfills (~40–60 KB no bundle
    // inicial) que ninguém usava. Se algum dia precisar suportar navegador
    // antigo, reintroduza aqui.
    // Compressão pre-build desativada para evitar o erro "[vite:compression] EMFILE: too many open files"
    // Hosts modernos (Vercel, Cloudflare Pages, GitHub Pages) já comprimem on-the-fly (Brotli/Gzip) no Edge.
    // Para Capacitor (nativo), a compressão também já era ignorada.
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["jeep-sqlite/loader", "jeep-sqlite"],
    exclude: ["@capacitor-community/sqlite"],
    entries: ["index.html"],
  },

  build: {
    emptyOutDir: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
          'vendor-radix': ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-popover', '@radix-ui/react-slot', '@radix-ui/react-tabs'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['pdfjs-dist'],
        }
      },
    },
  },
}));

