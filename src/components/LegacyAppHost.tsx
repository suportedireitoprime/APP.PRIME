import { lazy, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// The imported Direito Prime app touches window/localStorage at import time,
// so it is loaded only in the browser.
const LegacyApp = lazy(async () => {
  await import("@/lib/domGuard").catch(() => {});
  return import("@/App");
});

export function LegacyAppHost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="min-h-screen bg-[#0D0F12]" style={{ backgroundColor: "#0D0F12" }} />;
  }
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-[#0D0F12]" style={{ backgroundColor: "#0D0F12" }} />}>
        <div id="root">
          <LegacyApp />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
