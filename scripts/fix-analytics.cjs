const fs = require('fs');

function replaceInit(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /if\s*\(\s*typeof window !== "undefined"\s*\)\s*\{\s*initAnalytics\(\);\s*initNavTelemetry\(\);\s*import\("@\/lib\/enableMouseDragScroll"\)\.then\(\(m\) => m\.enableMouseDragScroll\(\)\);\s*import\("@\/lib\/appMetrics"\)\.then\(\(m\) => m\.startAppMetrics\(\)\);\s*\}/s,
    `if (typeof window !== "undefined") {
  const scheduleAnalytics = () => {
    initAnalytics();
    initNavTelemetry();
    import("@/lib/enableMouseDragScroll").then((m) => m.enableMouseDragScroll());
    import("@/lib/appMetrics").then((m) => m.startAppMetrics());
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(scheduleAnalytics, { timeout: 3000 });
  } else {
    setTimeout(scheduleAnalytics, 1500);
  }
}`
  );
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}

replaceInit('src/App.tsx');
replaceInit('src/AppRoutes.tsx');
