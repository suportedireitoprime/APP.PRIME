import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export function EqualizadorAnimado({ cor = 'currentColor' }: { cor?: string }) {
  return (
    <span className="inline-flex items-end gap-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <motion.span
        className="w-0.5 sm:w-[2.5px] rounded-full"
        style={{ backgroundColor: cor }}
        animate={{ height: ['25%', '95%', '40%', '80%', '30%'] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="w-0.5 sm:w-[2.5px] rounded-full"
        style={{ backgroundColor: cor }}
        animate={{ height: ['60%', '30%', '100%', '45%', '70%'] }}
        transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
      />
      <motion.span
        className="w-0.5 sm:w-[2.5px] rounded-full"
        style={{ backgroundColor: cor }}
        animate={{ height: ['35%', '85%', '25%', '90%', '40%'] }}
        transition={{ duration: 0.65, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
    </span>
  );
}

export function dispararConfete() {
  try {
    void confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#10b981', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6'],
    });
  } catch {
    // fallback seguro
  }
}

export function formatarTempoSegundos(segundos: number): string {
  if (!segundos || isNaN(segundos) || segundos <= 0) return '00:00';
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatarTituloAula(rawTitulo: string): string {
  if (!rawTitulo) return '';

  let texto = rawTitulo
    .trim()
    .replace(/^[0-9]+[. \t\-–—]+/i, '')
    .trim();

  texto = texto
    .replace(/^(?:ECA|CF\/?88|CP|CPP|CC|CPC|CLT|CTN|CDC|CTB|OAB|EOAB)\s*[-–—:]\s*/i, '')
    .trim();
  texto = texto.replace(/^(?:ECA\s*[-–—:]\s*)+/i, '').trim();

  const matchArtigo = texto.match(
    /^art(?:igo|\.)?\s*([0-9]+(?:\s*[-–—]\s*[A-Za-z]+|[A-Za-z]+)?)[º°ª]?(?:\s*[-–—:]\s*(.*))?$/i,
  );
  if (matchArtigo) {
    const num = matchArtigo[1].replace(/\s+/g, '').trim();
    const resto = (matchArtigo[2] || '').trim();
    if (resto) {
      return `Art. ${num}: ${resto.charAt(0).toUpperCase() + resto.slice(1)}`;
    }
    return `Art. ${num}`;
  }

  return texto;
}
