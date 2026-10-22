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
import { R2_MIDIAS_BASE_URL, R2_LIVROS_PDF_BASE_URL } from '@/lib/storageBuckets';
const SUPABASE_STORAGE_CAPAS = `${R2_LIVROS_PDF_BASE_URL}/biblioteca-obras/capas_areas`;

// Capas oficiais das matérias das audioaulas (R2 estudos-juridicos-midias/audioaulas/capas)
const R2_CAPAS_AUDIO = `${R2_MIDIAS_BASE_URL}/audioaulas/capas`;
const c = (slug: string) => `${R2_CAPAS_AUDIO}/${slug}.webp`;

const CAPAS: { re: RegExp; url: string }[] = [
  { re: /lei penal especial|penal especial|organiza[çc][õo]es criminosas/i, url: c('lei-penal-especial') },
  { re: /process(o|ual) penal/i, url: c('direito-processual-penal') },
  { re: /process(o|ual) civil/i, url: c('direito-processual-civil') },
  { re: /process(o|ual) do trabalho/i, url: c('direito-processual-do-trabalho') },
  { re: /filosofia|teoria/i, url: c('teoria-e-filosofia-do-direito') },
  { re: /urban/i, url: c('direito-urbanistico') },
  { re: /desport/i, url: c('direito-desportivo') },
  { re: /financeir/i, url: c('direito-financeiro') },
  { re: /portugu/i, url: c('portugues') },
  { re: /pol[íi]ticas p[úu]blicas/i, url: c('politicas-publicas') },
  { re: /forma[çc][ãa]o complementar|complementar/i, url: c('formacao-complementar') },
  { re: /internacional/i, url: c('direito-internacional-privado') },
  { re: /direitos humanos/i, url: c('direitos-humanos') },
  { re: /penal/i, url: c('direito-penal') },
  { re: /civil/i, url: c('direito-civil') },
  { re: /constitu/i, url: c('direito-constitucional') },
  { re: /trabalh|clt/i, url: c('direito-do-trabalho') },
  { re: /tribut/i, url: c('direito-tributario') },
  { re: /empresarial|comercial/i, url: c('direito-empresarial') },
  { re: /administrativ/i, url: c('direito-administrativo') },
  { re: /ambiental/i, url: c('direito-ambiental') },
  { re: /previdenci/i, url: c('direito-previdenciario') },
  { re: /eca|criança|adolescente|infância|juventude/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-crianca-adolescente-eca.webp` },
  { re: /médico|medico/i, url: capaMedico },
  { re: /filosofia/i, url: capaFilosofia },
  { re: /lei penal especial/i, url: capaLeiPenalEspecial },
  { re: /processo penal/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-processual-penal.webp` },
  { re: /processo civil/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-processual-civil.webp` },
  { re: /processo do trabalho/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-processual-do-trabalho.webp` },
  { re: /penal/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-penal.webp` },
  { re: /civil/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-civil.webp` },
  { re: /constitu/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-constitucional.webp` },
  { re: /trabalh|clt/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-do-trabalho.webp` },
  { re: /tribut/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-tributario.webp` },
  { re: /consumidor/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-do-consumidor.webp` },
  { re: /eleitoral/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-eleitoral.webp` },
  { re: /empresarial|comercial/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-empresarial.webp` },
  { re: /administrativ/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-administrativo.webp` },
  { re: /ambiental/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-ambiental.webp` },
  { re: /previdenci/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-previdenciario.webp` },
  { re: /internacional/i, url: `${SUPABASE_STORAGE_CAPAS}/direito-internacional.webp` },
  { re: /direitos humanos/i, url: `${SUPABASE_STORAGE_CAPAS}/direitos-humanos.webp` },
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
