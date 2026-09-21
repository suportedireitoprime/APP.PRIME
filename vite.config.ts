import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
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
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          
          // Core React (separação agressiva do react e do router)
          if (id.includes("react-router-dom") || id.includes("react-router")) return "react-router";
          if (id.includes("react-dom") || id.includes("/react/")) return "react-core";
          
          // Banco de dados e Cloud
          if (id.includes("@supabase/supabase-js") || id.includes("@supabase/postgrest-js") || id.includes("@supabase/realtime-js") || id.includes("@supabase/gotrue-js") || id.includes("@supabase/storage-js")) return "supabase";
          if (id.includes("firebase") || id.includes("@capacitor-firebase")) return "firebase";
          
          // Ecossistema Capacitor Nativo
          if (id.includes("@capacitor") || id.includes("@capawesome") || id.includes("@capgo")) return "capacitor";
          
          if (id.includes("framer-motion")) return "motion";
          
          // Componentes da Interface (UI Framework)
          if (id.includes("@radix-ui") || id.includes("sonner") || id.includes("cmdk") || id.includes("vaul")) return "ui-core";
          if (id.includes("lucide-react")) return "icons";
          
          // Utilitários de Mídia e Listas Dinâmicas
          if (id.includes("remotion")) return "remotion";
          if (id.includes("embla-carousel") || id.includes("swiper") || id.includes("react-window") || id.includes("@tanstack/react-virtual")) return "lists-media";
          if (id.includes("jspdf") || id.includes("react-pdf") || id.includes("pdfjs-dist")) return "pdf";
          if (id.includes("tesseract.js")) return "ocr";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          
          // Cache e Pesquisa
          if (id.includes("dexie") || id.includes("idb-keyval") || id.includes("@tanstack/react-query")) return "data-cache";
          if (id.includes("fuse.js") || id.includes("minisearch")) return "search";
        },
      },
    },
  },
}));

