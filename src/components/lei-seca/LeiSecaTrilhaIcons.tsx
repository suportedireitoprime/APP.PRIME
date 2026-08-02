/**
 * Ícones SVG customizados para cada trilha de Lei Seca.
 * Desenhados à mão — não usar Lucide aqui para manter identidade visual única.
 * Paleta unificada: traçado violeta com preenchimento sutil.
 */
import type { SVGProps, FC } from "react";

const base = {
  width: 26,
  height: 26,
  viewBox: "0 0 28 28",
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** CF — Constituição: colunas + frontão (templo cívico) */
const IconCF = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3 9l11-5 11 5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <path d="M5 9v12M11 9v12M17 9v12M23 9v12" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 22h22" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="14" cy="6.5" r="0.8" fill="currentColor" />
  </svg>
);

/** CP — Código Penal: martelo de juiz + linha */
const IconCP = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="11" y="3" width="12" height="5" rx="1.2" transform="rotate(25 17 5.5)" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
    <path d="M9 13l8 8" stroke="currentColor" strokeWidth="2" />
    <path d="M5 24h14" stroke="currentColor" strokeWidth="1.8" />
    <path d="M6 21l3-3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/** CC — Código Civil: livro aberto com listras */
const IconCC = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3 6c4-1 7-1 11 1 4-2 7-2 11-1v17c-4-1-7-1-11 1-4-2-7-2-11-1V6z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <path d="M14 7v17" stroke="currentColor" strokeWidth="1.4" />
    <path d="M6 11h5M6 14h5M17 11h5M17 14h5" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
  </svg>
);

/** CPP — Processo Penal: lupa + algema */
const IconCPP = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.7" fill="currentColor" fillOpacity="0.08" />
    <path d="M15.5 15.5l6 6" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.3" opacity="0.6" />
  </svg>
);

/** CPC — Processo Civil: documento com selo */
const IconCPC = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M6 3h10l5 5v17H6V3z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <path d="M16 3v5h5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 14h8M9 17h8M9 20h5" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
    <circle cx="18" cy="20" r="2.2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

/** CLT — Trabalho: capacete de operário */
const IconCLT = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 19c0-6 4.5-10 10-10s10 4 10 10" stroke="currentColor" strokeWidth="1.7" fill="currentColor" fillOpacity="0.1" />
    <path d="M3 19h22" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 22h22" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 9V5M11 10l-1-3M17 10l1-3" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

/** CDC — Consumidor: sacola */
const IconCDC = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M5 9h18l-2 15H7L5 9z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
    <path d="M10 9V6a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="11" cy="14" r="0.9" fill="currentColor" />
    <circle cx="17" cy="14" r="0.9" fill="currentColor" />
  </svg>
);

/** CTN — Tributário: moeda + cifrão */
const IconCTN = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.7" fill="currentColor" fillOpacity="0.08" />
    <path d="M14 7v14M17 10c-1-1-2-1.5-3.5-1.5S11 9.2 11 10.5s1 2 3 2.5 3 1.2 3 2.5-1 2-3 2-2.5-.5-3.5-1.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/** ECA — Criança e Adolescente: estrela protetora + figura pequena */
const IconECA = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M14 3l9 5v6c0 6-4 9-9 11-5-2-9-5-9-11V8l9-5z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
    <circle cx="14" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10 19c1-2.5 2.5-3.5 4-3.5s3 1 4 3.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

/** 8112 — Servidor: prédio público */
const Icon8112 = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 24V10l10-5 10 5v14" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <rect x="8" y="13" width="3" height="4" stroke="currentColor" strokeWidth="1.2" />
    <rect x="17" y="13" width="3" height="4" stroke="currentColor" strokeWidth="1.2" />
    <rect x="12" y="18" width="4" height="6" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.15" />
    <path d="M3 24h22" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

/** LINDB — Introdução ao Direito: livro com fita */
const IconLINDB = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M6 4h14a1 1 0 011 1v19l-4-2.5L14 24l-4-2.5L6 24V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
    <path d="M9 9h9M9 12h9M9 15h6" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
  </svg>
);

/** LGPD — Dados: cadeado com chip */
const IconLGPD = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="5" y="11" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
    <path d="M9 11V8a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="1.6" />
    <rect x="11" y="15" width="6" height="5" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
    <path d="M13 17h2" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

/** MP — Ministério Público: escudo com balança */
const IconMP = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M14 3l9 3v8c0 6-4 9-9 11-5-2-9-5-9-11V6l9-3z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
    <path d="M14 9v9M10 11h8M9 14a2 2 0 002 2M17 14a2 2 0 002 2" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

/** Drogas — Lei de Drogas: frasco com X */
const IconDrogas = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M10 3h8v4l3 5v11a2 2 0 01-2 2H9a2 2 0 01-2-2V12l3-5V3z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
    <path d="M10 3h8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M11 16l6 6M17 16l-6 6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

/** CTB — Trânsito: semáforo */
const IconCTB = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="9" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <circle cx="14" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="14" cy="12" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="14" cy="16" r="1.6" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.4" />
    <path d="M14 21v3M11 24h6" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/** CE — Eleitoral: urna */
const IconCE = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="4" y="8" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <path d="M10 8V5a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 14h10M9 17h10M9 20h6" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
  </svg>
);

/** Idoso: bengala */
const IconIdoso = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="5.5" r="2.3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 8v8l-3 8M11 13l4 3 3-2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M20 8c2 0 2 2 0 2v14" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/** Desarmamento */
const IconDesarm = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.7" fill="currentColor" fillOpacity="0.06" />
    <path d="M6 6l16 16" stroke="currentColor" strokeWidth="2" />
    <path d="M8 13h8v3h-2l-1 2H8v-5z" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

/** OAB: balança */
const IconOAB = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.7" fill="currentColor" fillOpacity="0.08" />
    <path d="M14 8v12M9 11h10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 11l-2 4h6l-2-4M21 11l-2 4h6l-2-4" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

/** PCD */
const IconPCD = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="13" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M13 8v6h6l3 6" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="14" cy="20" r="5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/** Maria da Penha */
const IconMariaPenha = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M14 24S4 18 4 11a5 5 0 0110-2 5 5 0 0110 2c0 7-10 13-10 13z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.12" />
    <path d="M11 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

/** LEP: grades */
const IconLEP = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="20" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.06" />
    <path d="M9 4v20M14 4v20M19 4v20" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 14h20" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/** Licitações: pranchete */
const IconLicit = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="6" y="5" width="16" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <rect x="10" y="3" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
    <path d="M10 14l2.5 2.5L18 11" stroke="currentColor" strokeWidth="1.7" />
    <path d="M10 19h8" stroke="currentColor" strokeWidth="1.3" opacity="0.6" />
  </svg>
);

/** Cidade: prédios */
const IconCidade = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3 24V12l6-3v15M9 24V6l8-3v21M17 24V10l6 2v12" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <path d="M12 9h2M12 13h2M12 17h2M20 14h1M20 18h1" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
  </svg>
);

/** Inquilinato: casa com chave */
const IconInquilinato = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 13l10-8 10 8v11H4V13z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <circle cx="11" cy="18" r="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M13 18h5v3" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

/** Marco Civil: globo */
const IconMarcoCivil = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <path d="M4 14h20M14 4c4 3 4 17 0 20M14 4c-4 3-4 17 0 20" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

/** Fallback genérico — Pergaminho */
const IconLeiGenerica = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M6 4h13a3 3 0 013 3v14a3 3 0 01-3 3H8a3 3 0 01-3-3V6" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
    <path d="M5 6a2 2 0 014 0v3H5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 12h9M10 15h9M10 18h6" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
  </svg>
);

export const LEI_SECA_ICONS: Record<string, FC<SVGProps<SVGSVGElement>>> = {
  cf: IconCF,
  cp: IconCP,
  cc: IconCC,
  cpp: IconCPP,
  cpc: IconCPC,
  clt: IconCLT,
  cdc: IconCDC,
  ctn: IconCTN,
  eca: IconECA,
  lei8112: Icon8112,
  lindb: IconLINDB,
  lgpd: IconLGPD,
  mp: IconMP,
  drogas: IconDrogas,
  ctb: IconCTB,
  ce: IconCE,
  idoso: IconIdoso,
  desarmamento: IconDesarm,
  oab: IconOAB,
  pcd: IconPCD,
  "maria-penha": IconMariaPenha,
  lep: IconLEP,
  licitacoes: IconLicit,
  cidade: IconCidade,
  inquilinato: IconInquilinato,
  "marco-civil": IconMarcoCivil,
};

export function getLeiSecaIcon(slug: string): FC<SVGProps<SVGSVGElement>> {
  return LEI_SECA_ICONS[slug] ?? IconLeiGenerica;
}
