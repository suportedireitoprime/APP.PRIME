// TanStack Start + Vite build configuration.
// Inclui automaticamente: TanStack devtools, tanstackStart, viteReact, tailwindcss, tsConfigPaths.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";
import fs from "node:fs";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    prerender: {
      routes: ["/"],
      crawlLinks: false,
    },
  },
  vite: {
    plugins: [
      {
        name: "serve-offline-bundle",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && (req.url.startsWith("/lousa-magica") || req.url.startsWith("/lousa-magica/"))) {
              const cleanUrl = req.url.split("?")[0];
              let targetPath = path.join(__dirname, "public", cleanUrl);
              if (!path.extname(targetPath)) {
                targetPath = path.join(targetPath, "index.html");
              }
              if (fs.existsSync(targetPath)) {
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                return fs.createReadStream(targetPath).pipe(res);
              }
            }
            if (req.url && req.url.startsWith("/offline-bundle/")) {
              const cleanUrl = req.url.split("?")[0];
              const filePath = path.join(__dirname, "public", cleanUrl);
              if (fs.existsSync(filePath)) {
                res.setHeader("Content-Type", "application/json");
                return fs.createReadStream(filePath).pipe(res);
              }
            }
            if (req.url && req.url.startsWith("/questoes-animadas/")) {
              const cleanUrl = req.url.split("?")[0];
              const filePath = path.join(__dirname, "public", cleanUrl);
              if (fs.existsSync(filePath)) {
                const ext = path.extname(filePath).toLowerCase();
                const mimeTypes: Record<string, string> = {
                  ".png": "image/png",
                  ".jpg": "image/jpeg",
                  ".jpeg": "image/jpeg",
                  ".webp": "image/webp",
                  ".html": "text/html; charset=utf-8",
                  ".js": "application/javascript",
                  ".css": "text/css",
                };
                res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
                return fs.createReadStream(filePath).pipe(res);
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: [
        {
          find: "react-router-dom",
          replacement: path.resolve(__dirname, "src/lib/router-compat.tsx"),
        },
        {
          find: /^use-sync-external-store\/shim\/with-selector(\.js)?$/,
          replacement: path.resolve(__dirname, "src/lib/useSyncExternalStoreShim.ts"),
        },
        {
          find: /^use-sync-external-store\/with-selector(\.js)?$/,
          replacement: path.resolve(__dirname, "src/lib/useSyncExternalStoreShim.ts"),
        },
      ],
    },
    server: {
      watch: { ignored: ["**/public/**"] },
      fs: {
        allow: [
          "..",
          "C:/Users/ext_wpereira/Downloads/ESTUDOS JURIDICOSs",
        ],
      },
    },
  },
});
