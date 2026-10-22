import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("[prepare-dist] Starting dist preparation...");

  // 1. Mirror .output/public -> dist if .output/public exists
  if (fs.existsSync(".output/public")) {
    fs.mkdirSync("dist", { recursive: true });
    fs.cpSync(".output/public", "dist", { recursive: true });
    console.log("[prepare-dist] Mirrored .output/public -> dist");
  }

  // 2. Obtain or render index.html (always prioritize rendering fresh via SSR worker if available)
  let html = "";
  if (fs.existsSync(".output/server/index.mjs")) {
    try {
      const serverPath = path.resolve(process.cwd(), ".output/server/index.mjs");
      const serverUrl = new URL(`file://${serverPath.replace(/\\/g, "/")}`).href;
      const server = await import(serverUrl);
      const env = { ASSETS: { fetch: () => new Response(null, { status: 404 }) } };
      const ctx = { waitUntil: () => {} };
      const res = await server.default.fetch(new Request("http://localhost/"), env, ctx);
      html = await res.text();
      console.log(`[prepare-dist] Rendered index.html via SSR worker (${html.length} bytes)`);
    } catch (err) {
      console.warn("[prepare-dist] SSR render notice:", err.message);
    }
  }

  if (!html && fs.existsSync("dist/index.html")) {
    html = fs.readFileSync("dist/index.html", "utf8");
  }

  // Safety net: ensure any pending route matches are marked as success so TanStack Router never aborts hydration
  if (html && html.includes('s:"pending"')) {
    html = html.replace(/s:"pending"/g, 's:"success"');
    console.log("[prepare-dist] Sanitized pending route matches to success");
  }

  // 3. Fallback shell if no HTML was rendered
  if (!html || !html.includes("<html")) {
    html = `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Direito Prime — Estudos Jurídicos</title>
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="icon" type="image/png" href="/favicon.png" />
  </head>
  <body style="background-color: #0D0D0D; color: #FFFFFF; margin: 0; padding: 0;">
    <div id="root"></div>
  </body>
</html>`;
  }

  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/index.html", html, "utf8");
  fs.writeFileSync("dist/200.html", html, "utf8");
  if (fs.existsSync(".output/public")) {
    fs.writeFileSync(".output/public/index.html", html, "utf8");
    fs.writeFileSync(".output/public/200.html", html, "utf8");
  }

  console.log("[prepare-dist] Successfully ensured dist/index.html and 200.html exist.");
}

main().catch((err) => {
  console.error("[prepare-dist] Error:", err);
  process.exit(1);
});
