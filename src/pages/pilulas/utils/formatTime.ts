/**
 * Formata segundos em string legível "M:SS".
 * Compartilhado entre PilulaControls, PilulasLeiSeca e outros players.
 */
export function formatTime(timeInSeconds: number): string {
  if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
