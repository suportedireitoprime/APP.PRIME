import { srcOf } from '@/lib/assetUrl';
import capaAudioaulas from '@/assets/atalho-audioaulas.webp.asset.json';
import capaPenal from '@/assets/direito-penal.webp.asset.json';
import capaCivil from '@/assets/direito-civil.webp.asset.json';
import capaConstituicao from '@/assets/direito-constituicao.webp.asset.json';
import capaClt from '@/assets/direito-clt.webp.asset.json';
import capaMedico from '@/assets/capa-direito-medico.webp';
import capaFilosofia from '@/assets/capa-filosofia.webp';
import capaLeiPenalEspecial from '@/assets/capa-lei-penal-especial.webp';
import capaProcessoPenal from '@/assets/capa-processo-penal.webp';

export const CAPA_HUB = srcOf(capaAudioaulas);
const CAPAS: { re: RegExp; url: string }[] = [
  { re: /eca|criança|adolescente|infância|juventude/i, url: '/assets/eca-kids.webp' },
  { re: /médico|medico/i, url: capaMedico },
  { re: /filosofia/i, url: capaFilosofia },
  { re: /lei penal especial/i, url: capaLeiPenalEspecial },
  { re: /processo penal/i, url: capaProcessoPenal },
  { re: /penal/i, url: srcOf(capaPenal) },
  { re: /civil/i, url: srcOf(capaCivil) },
  { re: /constitu/i, url: srcOf(capaConstituicao) },
  { re: /trabalh|clt/i, url: srcOf(capaClt) },
];

export const capaDaArea = (area: string) => CAPAS.find((c) => c.re.test(area))?.url || CAPA_HUB;

export const normalizar = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const VELOCIDADES = [1, 1.25, 1.5, 2];

export function decomporTituloCapitulo(tema: string): { tituloLimpo: string; faixaArtigos: string } {
  let nome = (tema || '').trim();
  let faixaArtigos = '';

  // 1. Extrair faixa de artigos entre parênteses no final, ex: "(arts. 1 a 6)" ou "(art. 62)"
  const matchParen = nome.match(/\((?:arts?\.?|artigos?)\s*([^)]+)\)$/i);
  if (matchParen) {
    const rawFaixa = matchParen[1].trim();
    faixaArtigos = /^art/i.test(rawFaixa) ? rawFaixa : `Arts. ${rawFaixa}`;
    nome = nome.replace(/\s*\((?:arts?\.?|artigos?)\s*[^)]+\)$/i, '').trim();
  }

  // 2. Remover divisões legais sequenciais (Liv., Tít., Cap., Seção, Subseção, etc.)
  // ex: "Tít. I — Cap. I — Da Atividade de Advocacia" -> "Da Atividade de Advocacia"
  // ex: "Liv. I, Tít. II, Cap. V — Do Direito à Profissionalização..." -> "Do Direito à Profissionalização..."
  const isPrefixoLegal = (parte: string) =>
    /^(?:liv(?:ro|\.)?|t[íi]t(?:ulo|\.)?|cap(?:[íi]tulo|\.)?|se[çc](?:[ãa]o|\.)?|subse[çc](?:[ãa]o|\.)?|parte)/i.test(parte.trim());

  const partesTravessao = nome.split(/\s+[—–-]\s+/);
  if (partesTravessao.length > 1 && isPrefixoLegal(partesTravessao[0])) {
    let idx = 0;
    while (idx < partesTravessao.length - 1 && isPrefixoLegal(partesTravessao[idx])) {
      idx++;
    }
    nome = partesTravessao.slice(idx).join(' — ').trim();
  }

  // 3. Limpeza de qualquer prefixo residual (ex: "Capítulo 1 — ", "Cap. I: ", "Tít. I - ")
  nome = nome.replace(
    /^(?:(?:liv(?:ro|\.)?|t[íi]t(?:ulo|\.)?|cap(?:[íi]tulo|\.)?|se[çc](?:[ãa]o|\.)?|subse[çc](?:[ãa]o|\.)?|parte)\s*[^:—–-]+[:—–-]\s*)+/i,
    ''
  ).trim();

  // 4. Fallback se não pegou faixaArtigos
  if (!faixaArtigos) {
    const matchArtAvulso = tema.match(/(?:arts?\.?|artigos?)\s*([0-9]+(?:\s*(?:a|ao|-|até)\s*[0-9]+[A-Za-z]*)?)/i);
    if (matchArtAvulso) {
      faixaArtigos = `Arts. ${matchArtAvulso[1].trim()}`;
    }
  }

  return {
    tituloLimpo: nome || tema,
    faixaArtigos
  };
}
