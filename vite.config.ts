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
    // Emit precompressed .gz and .br artifacts alongside each JS/CSS/HTML/SVG.
    // Static hosts (Netlify, Cloudflare Pages, Nginx) will serve these
    // directly when the client sends Accept-Encoding: br/gzip, cutting
    // transfer size ~70–85%. Skip in dev so HMR stays fast.
    // Skip precompression for native (Capacitor) builds: the WebView reads files
    // straight from the APK's assets folder with no Accept-Encoding negotiation,
    // so shipping both `foo.js` and `foo.js.gz` only wastes space AND makes
    // Android's Asset Merger fail with "Duplicate resources" (it strips .gz).
    mode !== "development" && !process.env.SKIP_PRECOMPRESS && viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
      filter: (file: string) => /\.(js|mjs|css|html|svg)$/i.test(file),
      deleteOriginFile: false,
    }),
    mode !== "development" && !process.env.SKIP_PRECOMPRESS && viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
      filter: (file: string) => /\.(js|mjs|css|html|svg)$/i.test(file),
      deleteOriginFile: false,
      compressionOptions: { params: { [/* zlib.constants.BROTLI_PARAM_QUALITY */ 1]: 9 } },
    }),
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

