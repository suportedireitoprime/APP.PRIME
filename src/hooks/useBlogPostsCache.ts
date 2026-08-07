/**
 * Cache stale-while-revalidate dos posts do blog no localStorage.
 * — 1ª visita: fetch normal, popula cache.
 * — Visitas seguintes (24 h): hidrata sincronamente e revalida em background.
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BlogPost, BlogTema } from '@/data/blogPosts';
import { TEMAS } from '@/data/blogPosts';
import { bundle } from '@/services/offlineBundle';

import esperancaImg from '@/assets/blog/esperanca-garcia.png';
import kelsenImg from '@/assets/blog/piramide-de-kelsen.png';
import inquilinatoImg from '@/assets/blog/inquilinato.png';
import lgpdImg from '@/assets/blog/lgpd.png';
import aristotelesImg from '@/assets/blog/aristoteles.png';
import terrasIndigenasImg from '@/assets/blog/terras-indigenas.png';
import inquisicaoImg from '@/assets/blog/inquisicao.png';
import prisao2aInstanciaImg from '@/assets/blog/prisao-2a-instancia.png';
import clienteDificilImg from '@/assets/blog/cliente-dificil.png';
import reformaTributariaImg from '@/assets/blog/reforma-tributaria.png';
import processoLegislativoImg from '@/assets/blog/processo-legislativo.png';
import hartDworkinImg from '@/assets/blog/hart-dworkin.png';

const KEY = 'blog:posts:v13';
const LEGACY_KEYS = ['blog:posts:v1', 'blog:posts:v2', 'blog:posts:v3', 'blog:posts:v4', 'blog:posts:v5', 'blog:posts:v6', 'blog:posts:v7', 'blog:posts:v8', 'blog:posts:v9', 'blog:posts:v10', 'blog:posts:v11', 'blog:posts:v12'];
const TTL_MS = 24 * 60 * 60 * 1000; // 24 h

const LISTA_COLS =
  'id, titulo, resumo, imagem_url, categoria, autor, tempo_leitura_min, data_publicacao, created_at';

type RawPost = {
  id: string;
  titulo: string;
  resumo: string;
  conteudo_md?: string;
  imagem_url: string;
  categoria: string;
  autor: string;
  tempo_leitura_min: number;
  data_publicacao: string;
  created_at: string;
};

type Cached = { at: number; posts: BlogPost[] };

function createVectorSvgCover(categoria: string, titulo: string): string {
  const cat = (categoria || 'Leis').toLowerCase();
  const t = (titulo || '').toLowerCase();

  let bgGradient = ['#2D4A3E', '#1B3028']; // Olive green Leis
  if (cat.includes('stf')) bgGradient = ['#1D3A5D', '#0F233B']; // STF blue
  else if (cat.includes('filosofia')) bgGradient = ['#4C2D6B', '#2C1642']; // Purple
  else if (cat.includes('clássicos') || cat.includes('classicos')) bgGradient = ['#7C2D2A', '#451614']; // Earth red
  else if (cat.includes('curiosidades')) bgGradient = ['#1D5D55', '#0E3631']; // Teal
  else if (cat.includes('atualidades')) bgGradient = ['#1E3A8A', '#0F172A']; // Tech blue

  // Elementos internos dinâmicos baseados no título específico
  let centerPropSvg = '';
  
  if (t.includes('victor nunes leal') || t.includes('súmula') || t.includes('sumula')) {
    // Ministro Victor Nunes Leal com Livro de Súmulas do STF
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" fill="#FFFFFF">
          <circle cx="0" cy="-90" r="55" />
          <path d="M -70 120 C -70 20, 70 20, 70 120 Z" />
          <rect x="-110" y="40" width="60" height="70" rx="10" />
        </g>
        <circle cx="0" cy="-90" r="48" fill="#EFE1BD" />
        <path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#1D3A5D" />
        <path d="M -15 28 L 0 65 L 15 28 Z" fill="#C9A26A" />
        <rect x="-102" y="45" width="60" height="65" rx="6" fill="#C9A26A" stroke="#FFFFFF" stroke-width="2" />
        <text x="-72" y="80" text-anchor="middle" fill="#1D3A5D" font-family="sans-serif" font-weight="bold" font-size="11">SÚMULAS STF</text>
      </g>`;
  } else if (t.includes('rousseau') || t.includes('contrato social')) {
    // Rousseau com Pena e Manuscrito do Contrato Social
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" fill="#FFFFFF">
          <circle cx="0" cy="-90" r="55" />
          <path d="M -70 120 C -70 20, 70 20, 70 120 Z" />
          <rect x="-110" y="40" width="60" height="70" rx="10" />
        </g>
        <circle cx="0" cy="-90" r="48" fill="#EFE1BD" />
        <path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#4C2D6B" />
        <rect x="-102" y="45" width="60" height="65" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="2" />
        <text x="-72" y="80" text-anchor="middle" fill="#4C2D6B" font-family="serif" font-weight="bold" font-size="9">CONTRATO SOCIAL</text>
      </g>`;
  } else if (t.includes('legalidade') || t.includes('estado de direito')) {
    // Jurista com Constituição e Balança da Legalidade
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round" fill="#FFFFFF">
          <circle cx="0" cy="-90" r="55" />
          <path d="M -70 120 C -70 20, 70 20, 70 120 Z" />
          <rect x="-100" y="40" width="55" height="65" rx="8" />
        </g>
        <circle cx="0" cy="-90" r="48" fill="#EFE1BD" />
        <path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#2D4A3E" />
        <rect x="-95" y="45" width="50" height="60" rx="6" fill="#8C1220" />
        <text x="-70" y="80" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="12">LEI</text>
      </g>`;
  } else if (t.includes('lei formal') || t.includes('lei material')) {
    // Comparativo de Lei Formal vs Lei Material
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="12" stroke-linejoin="round" fill="#FFFFFF">
          <rect x="-105" y="-70" width="90" height="150" rx="8" />
          <rect x="15" y="-70" width="90" height="150" rx="8" />
        </g>
        <rect x="-100" y="-65" width="80" height="140" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="2" />
        <text x="-60" y="0" text-anchor="middle" fill="#8C1220" font-family="sans-serif" font-weight="bold" font-size="14">LEI FORMAL</text>
        <rect x="20" y="-65" width="80" height="140" rx="6" fill="#F4E8C1" stroke="#1D3A5D" stroke-width="2" />
        <text x="60" y="0" text-anchor="middle" fill="#1D3A5D" font-family="sans-serif" font-weight="bold" font-size="14">LEI MATERIAL</text>
      </g>`;
  } else if (t.includes('menino') || t.includes('inteligente') || t.includes('enigma')) {
    // Jovem Prodígio com Lupa e Pergaminho
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" fill="#FFFFFF">
          <circle cx="0" cy="-90" r="55" />
          <path d="M -70 120 C -70 20, 70 20, 70 120 Z" />
          <circle cx="80" cy="20" r="35" />
        </g>
        <circle cx="0" cy="-90" r="48" fill="#EFE1BD" />
        <path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#1D5D55" />
        <circle cx="80" cy="20" r="28" fill="none" stroke="#C9A26A" stroke-width="8" />
        <line x1="100" y1="40" x2="130" y2="70" stroke="#C9A26A" stroke-width="10" stroke-linecap="round" />
      </g>`;
  } else if (t.includes('sherlock') || t.includes('expresso') || t.includes('assassinato')) {
    // Detetive com Lupa e Dossiê de Provas
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round" fill="#FFFFFF">
          <circle cx="0" cy="-90" r="55" />
          <path d="M -70 120 C -70 20, 70 20, 70 120 Z" />
          <rect x="-100" y="30" width="55" height="70" rx="6" />
        </g>
        <circle cx="0" cy="-90" r="48" fill="#EFE1BD" />
        <path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#2C2C2C" />
        <rect x="-95" y="35" width="45" height="60" rx="4" fill="#F4E8C1" />
        <text x="-72" y="70" text-anchor="middle" fill="#8C1220" font-family="sans-serif" font-weight="bold" font-size="10">PROVAS</text>
      </g>`;
  } else if (t.includes('habeas corpus') || t.includes('liberdade')) {
    // Alvará de Soltura e Algemas Abertas
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round" fill="#FFFFFF">
          <circle cx="0" cy="-90" r="55" />
          <path d="M -70 120 C -70 20, 70 20, 70 120 Z" />
          <rect x="-100" y="30" width="60" height="75" rx="6" />
        </g>
        <circle cx="0" cy="-90" r="48" fill="#EFE1BD" />
        <path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#1D3A5D" />
        <rect x="-95" y="35" width="50" height="65" rx="4" fill="#FFFFFF" stroke="#1D3A5D" stroke-width="2" />
        <text x="-70" y="72" text-anchor="middle" fill="#1D3A5D" font-family="sans-serif" font-weight="bold" font-size="10">HABEAS CORPUS</text>
      </g>`;
  } else if (t.includes('pétreas') || t.includes('petreas') || t.includes('cláusula')) {
    // Tábua de pedra com Constituição e Escudo de Proteção
    centerPropSvg = `
      <g filter="url(#shadow)">
        <path d="M -90 110 L -90 -60 Q -90 -100 0 -100 Q 90 -100 90 -60 L 90 110 Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round" />
        <path d="M -80 100 L -80 -55 Q -80 -90 0 -90 Q 80 -90 80 -55 L 80 100 Z" fill="#4A4A4A" stroke="#2C2C2C" stroke-width="4" />
        <path d="M 0 -70 L -45 -10 L 0 -10 L 0 50 L 45 -10 L 0 -10 Z" fill="#C9A26A" />
        <text x="0" y="30" text-anchor="middle" fill="#FFFFFF" font-family="serif" font-weight="bold" font-size="22">CF/88</text>
        <text x="0" y="70" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="16">ART. 60 §4º</text>
        <path d="M -120 40 L -60 -20 L 0 40 L 0 100 C 0 100 -120 100 -120 40 Z" fill="#8C1220" stroke="#FFFFFF" stroke-width="6" transform="translate(60, 20) scale(0.6)" />
      </g>`;
  } else if (t.includes('decreto') || t.includes('portaria') || t.includes('resolução') || t.includes('resolucao') || t.includes('normas infralegais')) {
    // 3 Documentos de Decretos/Portarias com Selos de Cera
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="12" fill="#FFFFFF" stroke-linejoin="round">
          <rect x="-110" y="-70" width="80" height="150" rx="8" />
          <rect x="-35" y="-90" width="80" height="160" rx="8" />
          <rect x="40" y="-70" width="80" height="150" rx="8" />
        </g>
        <rect x="-105" y="-65" width="70" height="140" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="2" />
        <circle cx="-70" cy="40" r="16" fill="#8C1220" />
        <rect x="-30" y="-85" width="70" height="150" rx="6" fill="#FFFFFF" stroke="#2C2C2C" stroke-width="2" />
        <circle cx="5" cy="30" r="18" fill="#1D3A5D" />
        <rect x="45" y="-65" width="70" height="140" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="2" />
        <circle cx="80" cy="40" r="16" fill="#2D4A3E" />
      </g>`;
  } else if (t.includes('hierarquia') || t.includes('manda em quem')) {
    // Pirâmide de Normas em 3 Níveis com Kelsen
    centerPropSvg = `
      <g filter="url(#shadow)">
        <polygon points="0,-110 -130,110 130,110" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round" />
        <polygon points="0,-100 -120,100 120,100" fill="#2C2C2C" />
        <polygon points="0,-100 -40,-30 40,-30" fill="#C9A26A" />
        <text x="0" y="-55" text-anchor="middle" fill="#1B3028" font-family="sans-serif" font-weight="bold" font-size="16">CF/88</text>
        <polygon points="-40,-30 40,-30 80,35 -80,35" fill="#8C1220" />
        <text x="0" y="10" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="16">LEIS</text>
        <polygon points="-80,35 80,35 120,100 -120,100" fill="#1D3A5D" />
        <text x="0" y="75" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="14">DECRETOS</text>
      </g>`;
  } else if (t.includes('revogação') || t.includes('revogacao') || t.includes('morte')) {
    // Livro com Carimbo REVOGADA
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="14" fill="#FFFFFF" stroke-linejoin="round">
          <rect x="-90" y="-70" width="180" height="150" rx="10" />
          <rect x="-10" y="-90" width="40" height="40" rx="6" />
        </g>
        <rect x="-85" y="-65" width="170" height="140" rx="8" fill="#8C1220" />
        <rect x="-70" y="-20" width="140" height="45" rx="6" fill="#FFFFFF" stroke="#B91C1C" stroke-width="4" transform="rotate(-12)" />
        <text x="0" y="10" text-anchor="middle" fill="#B91C1C" font-family="sans-serif" font-weight="900" font-size="18" transform="rotate(-12)">REVOGADA</text>
      </g>`;
  } else if (t.includes('3 v') || t.includes('vigência') || t.includes('eficácia') || t.includes('validade')) {
    // 3 Escudos com VIGÊNCIA, EFICÁCIA e VALIDADE
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="12" fill="#FFFFFF" stroke-linejoin="round">
          <circle cx="-85" cy="0" r="45" />
          <circle cx="0" cy="-40" r="45" />
          <circle cx="85" cy="0" r="45" />
        </g>
        <circle cx="-85" cy="0" r="40" fill="#1D3A5D" />
        <text x="-85" y="6" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="13">VALIDADE</text>
        <circle cx="0" cy="-40" r="40" fill="#8C1220" />
        <text x="0" y="-34" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="13">VIGÊNCIA</text>
        <circle cx="85" cy="0" r="40" fill="#2D4A3E" />
        <text x="85" y="6" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="13">EFICÁCIA</text>
      </g>`;
  } else if (t.includes('caput') || t.includes('inciso') || t.includes('parágrafo') || t.includes('paragrafo') || t.includes('alínea') || t.includes('alinea')) {
    // Estrutura do Artigo de Lei
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="12" fill="#FFFFFF" stroke-linejoin="round">
          <rect x="-90" y="-80" width="180" height="160" rx="10" />
        </g>
        <rect x="-85" y="-75" width="170" height="150" rx="8" fill="#F4E8C1" stroke="#C9A26A" stroke-width="3" />
        <rect x="-70" y="-60" width="140" height="30" rx="4" fill="#C9A26A" />
        <text x="0" y="-40" text-anchor="middle" fill="#1B3028" font-family="sans-serif" font-weight="bold" font-size="16">ARTIGO 1º (CAPUT)</text>
        <text x="-65" y="-5" fill="#2C2C2C" font-family="sans-serif" font-weight="bold" font-size="15">§ 1º Parágrafo Único</text>
        <text x="-65" y="25" fill="#8C1220" font-family="sans-serif" font-weight="bold" font-size="15">I - Inciso Primeiro</text>
        <text x="-65" y="55" fill="#1D3A5D" font-family="sans-serif" font-weight="bold" font-size="15">a) Alínea Primeira</text>
      </g>`;
  } else {
    // Ilustração Padrão Vetorial com Jurista e Balança com Contorno Branco
    centerPropSvg = `
      <g filter="url(#shadow)">
        <g stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" fill="#FFFFFF">
          <circle cx="0" cy="-90" r="55" />
          <path d="M -70 120 C -70 20, 70 20, 70 120 Z" />
          <rect x="-110" y="40" width="60" height="70" rx="10" />
          <path d="M 80 -20 L 130 50 L 80 80 Z" />
        </g>
        <circle cx="0" cy="-90" r="48" fill="#EFE1BD" />
        <path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#2C2C2C" />
        <path d="M -15 28 L 0 65 L 15 28 Z" fill="#8C1220" />
        <circle cx="0" cy="38" r="7" fill="#C9A26A" />
        <rect x="-102" y="45" width="52" height="62" rx="6" fill="#8C1220" />
        <line x1="-90" y1="58" x2="-62" y2="58" stroke="#C9A26A" stroke-width="4" />
        <line x1="-90" y1="72" x2="-62" y2="72" stroke="#C9A26A" stroke-width="3" />
        <path d="M 80 -10 L 125 50 M 102.5 -10 L 102.5 75 M 65 75 L 140 75" stroke="#C9A26A" stroke-width="5" stroke-linecap="round" />
        <path d="M 70 50 L 90 50 L 80 65 Z" fill="#C9A26A" />
        <path d="M 115 50 L 135 50 L 125 65 Z" fill="#C9A26A" />
      </g>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}" />
        <stop offset="100%" stop-color="${bgGradient[1]}" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-opacity="0.4" />
      </filter>
    </defs>
    <rect width="1200" height="675" fill="url(#bg)" />
    <!-- Background Watermark Grid and Legal Icons -->
    <g opacity="0.1" stroke="#FFFFFF" stroke-width="2" fill="none">
      <circle cx="200" cy="150" r="90" />
      <circle cx="1000" cy="500" r="130" />
      <path d="M 150 150 L 250 150 M 200 100 L 200 200" />
      <path d="M 950 500 L 1050 500 M 1000 450 L 1000 550" />
      <line x1="100" y1="610" x2="1100" y2="610" stroke-width="4" stroke-dasharray="16 16" />
    </g>
    <!-- Centered Custom Subject Scene -->
    <g transform="translate(600, 335)">
      ${centerPropSvg}
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function resolveCover(p: RawPost): string {
  const t = (p.titulo || '').toLowerCase();
  if (t.includes('hart x dworkin') || t.includes('hart') || t.includes('dworkin')) return hartDworkinImg;
  if (t.includes('quem cria as leis') || t.includes('processo legislativo') || t.includes('etapas do processo')) return processoLegislativoImg;
  if (t.includes('esperança garcia') || t.includes('esperanca garcia')) return esperancaImg;
  if (t.includes('kelsen') || t.includes('pirâmide') || t.includes('piramide')) return kelsenImg;
  if (t.includes('inquilinato') || t.includes('aluguel') || t.includes('locação') || t.includes('locacao')) return inquilinatoImg;
  if (t.includes('lgpd') || t.includes('privacidade') || t.includes('multas')) return lgpdImg;
  if (t.includes('aristóteles') || t.includes('aristoteles')) return aristotelesImg;
  if (t.includes('terras indígenas') || t.includes('terras indigenas') || t.includes('indígenas')) return terrasIndigenasImg;
  if (t.includes('inquisição') || t.includes('inquisicao') || t.includes('colônia')) return inquisicaoImg;
  if (t.includes('segunda instância') || t.includes('segunda instancia') || t.includes('adc 43')) return prisao2aInstanciaImg;
  if (t.includes('cliente difícil') || t.includes('cliente dificil') || t.includes('ética') || t.includes('etica')) return clienteDificilImg;
  if (t.includes('reforma tributária') || t.includes('reforma tributaria') || t.includes('tributária')) return reformaTributariaImg;

  // Qualquer post sem capa local importada recebe capa vetorial SVG personalizada
  // (ignora imagens genéricas antigas do Supabase Storage como capa-0.png, capa-1.png, etc.)
  return createVectorSvgCover(p.categoria, p.titulo);
}

function map(rows: RawPost[]): BlogPost[] {
  return rows.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    resumo: p.resumo,
    conteudo_md: p.conteudo_md ?? '',
    imagem_url: resolveCover(p),
    tema: (TEMAS.includes(p.categoria as BlogTema) ? p.categoria : 'Curiosidades') as BlogTema,
    autor: (!p.autor || p.autor === 'Redação OAB na Risca') ? 'Redação Estudos Jurídicos' : p.autor,
    tempo_leitura_min: p.tempo_leitura_min,
    data_publicacao: p.data_publicacao,
  }));
}

function readCache(): BlogPost[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (!parsed?.posts || !Array.isArray(parsed.posts)) return null;
    // Aceitamos até TTL para tela; refresh sempre roda em background de qualquer forma.
    if (Date.now() - parsed.at > TTL_MS) return parsed.posts; // ainda hidrata, marca stale
    return parsed.posts;
  } catch {
    return null;
  }
}

function writeCache(posts: BlogPost[]) {
  try {
    // Cache só da lista (sem o markdown completo): mantém o payload pequeno e
    // evita estourar a quota do localStorage — era o que fazia o cache falhar
    // e a tela recarregar tudo do zero a cada abertura.
    const leves = posts.map((p) => ({ ...p, conteudo_md: '' }));
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), posts: leves } satisfies Cached));
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* quota / private mode — ignora */
  }
}

export function useBlogPostsCache() {
  const initial = useMemo(() => readCache(), []);
  const [posts, setPosts] = useState<BlogPost[]>(initial ?? []);
  const [loaded, setLoaded] = useState<boolean>(!!initial);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let rows: RawPost[] | null = null;
      // Fase 1 — lista leve (sem o markdown): resposta pequena, pinta na hora.
      try {
        const { data } = await supabase
          .from('blog_edicao_posts')
          .select(LISTA_COLS)
          .eq('publicado', true)
          .order('data_publicacao', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(120);
        rows = (data as RawPost[]) ?? null;
      } catch {}
      // Fallback pro bundle nativo (Electron / sem rede)
      if (!rows || rows.length === 0) {
        const bundled = await bundle.blogPosts<RawPost>();
        if (bundled.length > 0) rows = bundled;
      }
      if (cancelled) return;
      if (rows && rows.length > 0) {
        const mapped = map(rows);
        setPosts(mapped);
        writeCache(mapped);
      }
      setLoaded(true);

      // Fase 2 — conteúdo completo em background, só dos posts em tela.
      const ids = (rows || []).map((r) => r.id).slice(0, 20);
      if (!ids.length) return;
      try {
        const { data: full } = await supabase
          .from('blog_edicao_posts')
          .select('id, conteudo_md')
          .in('id', ids);
        if (cancelled || !full) return;
        const byId = new Map((full as Array<{ id: string; conteudo_md: string }>).map((r) => [r.id, r.conteudo_md]));
        setPosts((prev) => prev.map((p) => (byId.has(p.id) ? { ...p, conteudo_md: byId.get(p.id) || p.conteudo_md } : p)));
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { posts, loaded };
}
