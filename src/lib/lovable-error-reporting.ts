// Error reporting interno da plataforma Direito Prime / Estudos Jurídicos
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && window.console) {
    console.error("[App Error]", error, context);
  }
}
