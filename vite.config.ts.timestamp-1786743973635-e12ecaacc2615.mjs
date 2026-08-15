// vite.config.ts
import { defineConfig } from "file:///C:/Users/ext_wpereira/OneDrive%20-%20Vitamina%20Work%20Life%20S.A/Documentos/APP.PRIME/node_modules/.pnpm/vite@5.4.21_@types+node@22.20.1_terser@5.49.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ext_wpereira/OneDrive%20-%20Vitamina%20Work%20Life%20S.A/Documentos/APP.PRIME/node_modules/.pnpm/@vitejs+plugin-react-swc@3._79eafd953dcafd2d90670b87536eeed4/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/ext_wpereira/OneDrive%20-%20Vitamina%20Work%20Life%20S.A/Documentos/APP.PRIME/node_modules/.pnpm/lovable-tagger@1.3.3_vite@5_922d45cee8fb55da3cbde3edcb464b44/node_modules/lovable-tagger/dist/index.js";
import viteCompression from "file:///C:/Users/ext_wpereira/OneDrive%20-%20Vitamina%20Work%20Life%20S.A/Documentos/APP.PRIME/node_modules/.pnpm/vite-plugin-compression@0.5_c535019bfa6dda060130d87d4d443480/node_modules/vite-plugin-compression/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\ext_wpereira\\OneDrive - Vitamina Work Life S.A\\Documentos\\APP.PRIME";
var vite_config_default = defineConfig(({ mode }) => ({
  // Base relativa ("./") permite empacotar para GitHub Pages (subpastas),
  // Electron (file://), Capacitor nativo e servidores estáticos.
  base: "./",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    },
    watch: {
      ignored: ["**/android/**", "**/ios/**"]
    }
  },
  plugins: [
    react(),
    // @vitejs/plugin-legacy removido: alvos suportados (Capacitor Android
    // WebView atual + Chrome/Safari/Firefox modernos) já entendem ES2020.
    // O plugin gerava um segundo build + polyfills (~40–60 KB no bundle
    // inicial) que ninguém usava. Se algum dia precisar suportar navegador
    // antigo, reintroduza aqui.
    mode === "development" && componentTagger(),
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
      deleteOriginFile: false
    }),
    mode !== "development" && !process.env.SKIP_PRECOMPRESS && viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
      deleteOriginFile: false,
      compressionOptions: { params: { [
        /* zlib.constants.BROTLI_PARAM_QUALITY */
        1
      ]: 11 } }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    },
    dedupe: ["react", "react-dom"]
  },
  optimizeDeps: {
    include: ["jeep-sqlite/loader", "jeep-sqlite"],
    exclude: ["@capacitor-community/sqlite"],
    entries: ["index.html", "src/**/*.{js,jsx,ts,tsx}"]
  },
  build: {
    // Split heavy vendors so initial route doesn't ship them.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("reactflow") || id.includes("@xyflow")) return "flow";
          if (id.includes("jspdf") || id.includes("react-pdf") || id.includes("pdfjs-dist")) return "pdf";
          if (id.includes("tesseract.js")) return "ocr";
          if (id.includes("@tanstack/react-virtual")) return "virtual";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("dexie")) return "dexie";
          if (id.includes("fuse.js")) return "search";
          if (id.includes("lucide-react")) return "icons";
        }
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxleHRfd3BlcmVpcmFcXFxcT25lRHJpdmUgLSBWaXRhbWluYSBXb3JrIExpZmUgUy5BXFxcXERvY3VtZW50b3NcXFxcQVBQLlBSSU1FXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxleHRfd3BlcmVpcmFcXFxcT25lRHJpdmUgLSBWaXRhbWluYSBXb3JrIExpZmUgUy5BXFxcXERvY3VtZW50b3NcXFxcQVBQLlBSSU1FXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9leHRfd3BlcmVpcmEvT25lRHJpdmUlMjAtJTIwVml0YW1pbmElMjBXb3JrJTIwTGlmZSUyMFMuQS9Eb2N1bWVudG9zL0FQUC5QUklNRS92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xuaW1wb3J0IHZpdGVDb21wcmVzc2lvbiBmcm9tIFwidml0ZS1wbHVnaW4tY29tcHJlc3Npb25cIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIC8vIEJhc2UgcmVsYXRpdmEgKFwiLi9cIikgcGVybWl0ZSBlbXBhY290YXIgcGFyYSBHaXRIdWIgUGFnZXMgKHN1YnBhc3RhcyksXG4gIC8vIEVsZWN0cm9uIChmaWxlOi8vKSwgQ2FwYWNpdG9yIG5hdGl2byBlIHNlcnZpZG9yZXMgZXN0XHUwMEUxdGljb3MuXG4gIGJhc2U6IFwiLi9cIixcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCI6OlwiLFxuICAgIHBvcnQ6IDgwODAsXG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiBmYWxzZSxcbiAgICB9LFxuICAgIHdhdGNoOiB7XG4gICAgICBpZ25vcmVkOiBbXCIqKi9hbmRyb2lkLyoqXCIsIFwiKiovaW9zLyoqXCJdXG4gICAgfVxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICAvLyBAdml0ZWpzL3BsdWdpbi1sZWdhY3kgcmVtb3ZpZG86IGFsdm9zIHN1cG9ydGFkb3MgKENhcGFjaXRvciBBbmRyb2lkXG4gICAgLy8gV2ViVmlldyBhdHVhbCArIENocm9tZS9TYWZhcmkvRmlyZWZveCBtb2Rlcm5vcykgalx1MDBFMSBlbnRlbmRlbSBFUzIwMjAuXG4gICAgLy8gTyBwbHVnaW4gZ2VyYXZhIHVtIHNlZ3VuZG8gYnVpbGQgKyBwb2x5ZmlsbHMgKH40MFx1MjAxMzYwIEtCIG5vIGJ1bmRsZVxuICAgIC8vIGluaWNpYWwpIHF1ZSBuaW5ndVx1MDBFOW0gdXNhdmEuIFNlIGFsZ3VtIGRpYSBwcmVjaXNhciBzdXBvcnRhciBuYXZlZ2Fkb3JcbiAgICAvLyBhbnRpZ28sIHJlaW50cm9kdXphIGFxdWkuXG4gICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxuICAgIC8vIEVtaXQgcHJlY29tcHJlc3NlZCAuZ3ogYW5kIC5iciBhcnRpZmFjdHMgYWxvbmdzaWRlIGVhY2ggSlMvQ1NTL0hUTUwvU1ZHLlxuICAgIC8vIFN0YXRpYyBob3N0cyAoTmV0bGlmeSwgQ2xvdWRmbGFyZSBQYWdlcywgTmdpbngpIHdpbGwgc2VydmUgdGhlc2VcbiAgICAvLyBkaXJlY3RseSB3aGVuIHRoZSBjbGllbnQgc2VuZHMgQWNjZXB0LUVuY29kaW5nOiBici9nemlwLCBjdXR0aW5nXG4gICAgLy8gdHJhbnNmZXIgc2l6ZSB+NzBcdTIwMTM4NSUuIFNraXAgaW4gZGV2IHNvIEhNUiBzdGF5cyBmYXN0LlxuICAgIC8vIFNraXAgcHJlY29tcHJlc3Npb24gZm9yIG5hdGl2ZSAoQ2FwYWNpdG9yKSBidWlsZHM6IHRoZSBXZWJWaWV3IHJlYWRzIGZpbGVzXG4gICAgLy8gc3RyYWlnaHQgZnJvbSB0aGUgQVBLJ3MgYXNzZXRzIGZvbGRlciB3aXRoIG5vIEFjY2VwdC1FbmNvZGluZyBuZWdvdGlhdGlvbixcbiAgICAvLyBzbyBzaGlwcGluZyBib3RoIGBmb28uanNgIGFuZCBgZm9vLmpzLmd6YCBvbmx5IHdhc3RlcyBzcGFjZSBBTkQgbWFrZXNcbiAgICAvLyBBbmRyb2lkJ3MgQXNzZXQgTWVyZ2VyIGZhaWwgd2l0aCBcIkR1cGxpY2F0ZSByZXNvdXJjZXNcIiAoaXQgc3RyaXBzIC5neikuXG4gICAgbW9kZSAhPT0gXCJkZXZlbG9wbWVudFwiICYmICFwcm9jZXNzLmVudi5TS0lQX1BSRUNPTVBSRVNTICYmIHZpdGVDb21wcmVzc2lvbih7XG4gICAgICBhbGdvcml0aG06IFwiZ3ppcFwiLFxuICAgICAgZXh0OiBcIi5nelwiLFxuICAgICAgdGhyZXNob2xkOiAxMDI0LFxuICAgICAgZGVsZXRlT3JpZ2luRmlsZTogZmFsc2UsXG4gICAgfSksXG4gICAgbW9kZSAhPT0gXCJkZXZlbG9wbWVudFwiICYmICFwcm9jZXNzLmVudi5TS0lQX1BSRUNPTVBSRVNTICYmIHZpdGVDb21wcmVzc2lvbih7XG4gICAgICBhbGdvcml0aG06IFwiYnJvdGxpQ29tcHJlc3NcIixcbiAgICAgIGV4dDogXCIuYnJcIixcbiAgICAgIHRocmVzaG9sZDogMTAyNCxcbiAgICAgIGRlbGV0ZU9yaWdpbkZpbGU6IGZhbHNlLFxuICAgICAgY29tcHJlc3Npb25PcHRpb25zOiB7IHBhcmFtczogeyBbLyogemxpYi5jb25zdGFudHMuQlJPVExJX1BBUkFNX1FVQUxJVFkgKi8gMV06IDExIH0gfSxcbiAgICB9KSxcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXCJqZWVwLXNxbGl0ZS9sb2FkZXJcIiwgXCJqZWVwLXNxbGl0ZVwiXSxcbiAgICBleGNsdWRlOiBbXCJAY2FwYWNpdG9yLWNvbW11bml0eS9zcWxpdGVcIl0sXG4gICAgZW50cmllczogW1wiaW5kZXguaHRtbFwiLCBcInNyYy8qKi8qLntqcyxqc3gsdHMsdHN4fVwiXSxcbiAgfSxcblxuICBidWlsZDoge1xuICAgIC8vIFNwbGl0IGhlYXZ5IHZlbmRvcnMgc28gaW5pdGlhbCByb3V0ZSBkb2Vzbid0IHNoaXAgdGhlbS5cbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgaWYgKCFpZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlc1wiKSkgcmV0dXJuO1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImZyYW1lci1tb3Rpb25cIikpIHJldHVybiBcIm1vdGlvblwiO1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlYWN0Zmxvd1wiKSB8fCBpZC5pbmNsdWRlcyhcIkB4eWZsb3dcIikpIHJldHVybiBcImZsb3dcIjtcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJqc3BkZlwiKSB8fCBpZC5pbmNsdWRlcyhcInJlYWN0LXBkZlwiKSB8fCBpZC5pbmNsdWRlcyhcInBkZmpzLWRpc3RcIikpIHJldHVybiBcInBkZlwiO1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInRlc3NlcmFjdC5qc1wiKSkgcmV0dXJuIFwib2NyXCI7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiQHRhbnN0YWNrL3JlYWN0LXZpcnR1YWxcIikpIHJldHVybiBcInZpcnR1YWxcIjtcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWNoYXJ0c1wiKSB8fCBpZC5pbmNsdWRlcyhcImQzLVwiKSkgcmV0dXJuIFwiY2hhcnRzXCI7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiZGV4aWVcIikpIHJldHVybiBcImRleGllXCI7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiZnVzZS5qc1wiKSkgcmV0dXJuIFwic2VhcmNoXCI7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibHVjaWRlLXJlYWN0XCIpKSByZXR1cm4gXCJpY29uc1wiO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSkpO1xuXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRhLFNBQVMsb0JBQW9CO0FBQ3pjLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsT0FBTyxxQkFBcUI7QUFKNUIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQTtBQUFBO0FBQUEsRUFHekMsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLElBQ1g7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFNBQVMsQ0FBQyxpQkFBaUIsV0FBVztBQUFBLElBQ3hDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU1OLFNBQVMsaUJBQWlCLGdCQUFnQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVMxQyxTQUFTLGlCQUFpQixDQUFDLFFBQVEsSUFBSSxvQkFBb0IsZ0JBQWdCO0FBQUEsTUFDekUsV0FBVztBQUFBLE1BQ1gsS0FBSztBQUFBLE1BQ0wsV0FBVztBQUFBLE1BQ1gsa0JBQWtCO0FBQUEsSUFDcEIsQ0FBQztBQUFBLElBQ0QsU0FBUyxpQkFBaUIsQ0FBQyxRQUFRLElBQUksb0JBQW9CLGdCQUFnQjtBQUFBLE1BQ3pFLFdBQVc7QUFBQSxNQUNYLEtBQUs7QUFBQSxNQUNMLFdBQVc7QUFBQSxNQUNYLGtCQUFrQjtBQUFBLE1BQ2xCLG9CQUFvQixFQUFFLFFBQVEsRUFBRTtBQUFBO0FBQUEsUUFBMkM7QUFBQSxNQUFDLEdBQUcsR0FBRyxFQUFFO0FBQUEsSUFDdEYsQ0FBQztBQUFBLEVBQ0gsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxJQUNBLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLHNCQUFzQixhQUFhO0FBQUEsSUFDN0MsU0FBUyxDQUFDLDZCQUE2QjtBQUFBLElBQ3ZDLFNBQVMsQ0FBQyxjQUFjLDBCQUEwQjtBQUFBLEVBQ3BEO0FBQUEsRUFFQSxPQUFPO0FBQUE7QUFBQSxJQUVMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGFBQWEsSUFBSTtBQUNmLGNBQUksQ0FBQyxHQUFHLFNBQVMsY0FBYyxFQUFHO0FBQ2xDLGNBQUksR0FBRyxTQUFTLGVBQWUsRUFBRyxRQUFPO0FBQ3pDLGNBQUksR0FBRyxTQUFTLFdBQVcsS0FBSyxHQUFHLFNBQVMsU0FBUyxFQUFHLFFBQU87QUFDL0QsY0FBSSxHQUFHLFNBQVMsT0FBTyxLQUFLLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLFlBQVksRUFBRyxRQUFPO0FBQzFGLGNBQUksR0FBRyxTQUFTLGNBQWMsRUFBRyxRQUFPO0FBQ3hDLGNBQUksR0FBRyxTQUFTLHlCQUF5QixFQUFHLFFBQU87QUFDbkQsY0FBSSxHQUFHLFNBQVMsVUFBVSxLQUFLLEdBQUcsU0FBUyxLQUFLLEVBQUcsUUFBTztBQUMxRCxjQUFJLEdBQUcsU0FBUyxPQUFPLEVBQUcsUUFBTztBQUNqQyxjQUFJLEdBQUcsU0FBUyxTQUFTLEVBQUcsUUFBTztBQUNuQyxjQUFJLEdBQUcsU0FBUyxjQUFjLEVBQUcsUUFBTztBQUFBLFFBQzFDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
