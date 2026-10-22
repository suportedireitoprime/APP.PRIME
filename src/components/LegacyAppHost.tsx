import { lazy, Suspense, useEffect, useState } from "react";

// The imported Direito Prime app touches window/localStorage at import time,
// so it is loaded only in the browser.
const LegacyApp = lazy(async () => {
  await import("@/lib/domGuard");
  await Promise.all([
    import("@fontsource/bebas-neue/400.css"),
    import("@fontsource/barlow/400.css"),
    import("@fontsource/barlow/500.css"),
    import("@fontsource/barlow/600.css"),
    import("@fontsource/barlow/700.css"),
    import("@fontsource/barlow-condensed/600.css"),
    import("@fontsource/barlow-condensed/700.css"),
    import("@fontsource/literata/400.css"),
    import("@fontsource/plus-jakarta-sans/700.css"),
  ]);
  return import("@/App");
});

export function LegacyAppHost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <div id="root">
        <LegacyApp />
      </div>
    </Suspense>
  );
}
