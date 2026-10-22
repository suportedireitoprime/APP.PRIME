import { lazy, Suspense, useEffect, useState } from "react";

// The imported Direito Prime app touches window/localStorage at import time,
// so it is loaded only in the browser.
const LegacyApp = lazy(async () => {
  await import("@/lib/domGuard").catch(() => {});
  await Promise.all([
    import("@fontsource/bebas-neue/400.css").catch(() => {}),
    import("@fontsource/barlow/400.css").catch(() => {}),
    import("@fontsource/barlow/500.css").catch(() => {}),
    import("@fontsource/barlow/600.css").catch(() => {}),
    import("@fontsource/barlow/700.css").catch(() => {}),
    import("@fontsource/barlow-condensed/600.css").catch(() => {}),
    import("@fontsource/barlow-condensed/700.css").catch(() => {}),
    import("@fontsource/literata/400.css").catch(() => {}),
    import("@fontsource/plus-jakarta-sans/700.css").catch(() => {}),
  ]);
  return import("@/App");
});

export function LegacyAppHost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="min-h-screen bg-[#0D0F12]" style={{ backgroundColor: "#0D0F12" }} />;
  }
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0F12]" style={{ backgroundColor: "#0D0F12" }} />}>
      <div id="root">
        <LegacyApp />
      </div>
    </Suspense>
  );
}
