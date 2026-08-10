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

const KEY = 'blog:posts:v16';
const LEGACY_KEYS = ['blog:posts:v1', 'blog:posts:v2', 'blog:posts:v3', 'blog:posts:v4', 'blog:posts:v5', 'blog:posts:v6', 'blog:posts:v7', 'blog:posts:v8', 'blog:posts:v9', 'blog:posts:v10', 'blog:posts:v11', 'blog:posts:v12', 'blog:posts:v13', 'blog:posts:v14', 'blog:posts:v15'];
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
  if (cat.includes('stf')) bgGradient = ['#1D3A5D', '#0F233B'];
  else if (cat.includes('filosofia')) bgGradient = ['#4C2D6B', '#2C1642'];
  else if (cat.includes('clássicos') || cat.includes('classicos')) bgGradient = ['#7C2D2A', '#451614'];
  else if (cat.includes('curiosidades')) bgGradient = ['#1D5D55', '#0E3631'];
  else if (cat.includes('atualidades')) bgGradient = ['#1E3A8A', '#0F172A'];

  let centerPropSvg = '';

  // ─── FILOSOFIA ───
  if (t.includes('rawls') || t.includes('véu da ignorância') || t.includes('equidade')) {
    // Véu da Ignorância: cortina + balança
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><path d="M -100 -100 Q 0 -140 100 -100 L 100 100 L -100 100 Z"/></g><path d="M -90 -90 Q 0 -130 90 -90 L 90 90 L -90 90 Z" fill="#4C2D6B"/><line x1="0" y1="-60" x2="0" y2="60" stroke="#C9A26A" stroke-width="6"/><line x1="-60" y1="-30" x2="60" y2="-30" stroke="#C9A26A" stroke-width="5"/><path d="M -70 -30 L -50 20 L -90 20 Z" fill="#C9A26A"/><path d="M 70 -30 L 50 20 L 90 20 Z" fill="#C9A26A"/><text x="0" y="80" text-anchor="middle" fill="#F4E8C1" font-family="serif" font-weight="bold" font-size="16">EQUIDADE</text></g>`;
  } else if (t.includes('maquiavel') || t.includes('príncipe') || t.includes('principe')) {
    // Maquiavel: coroa + máscara dupla
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><path d="M -60 -100 L -80 -50 L -40 -70 L 0 -40 L 40 -70 L 80 -50 L 60 -100 Z"/><circle cx="-40" cy="30" r="50"/><circle cx="40" cy="30" r="50"/></g><path d="M -55 -95 L -72 -53 L -35 -68 L 0 -42 L 35 -68 L 72 -53 L 55 -95 Z" fill="#C9A26A"/><circle cx="-40" cy="30" r="43" fill="#EFE1BD"/><circle cx="-52" cy="18" r="8" fill="#2C1642"/><circle cx="-28" cy="18" r="8" fill="#2C1642"/><path d="M -52 42 Q -40 54 -28 42" stroke="#2C1642" stroke-width="4" fill="none"/><circle cx="40" cy="30" r="43" fill="#2C2C2C"/><circle cx="28" cy="18" r="8" fill="#C9A26A"/><circle cx="52" cy="18" r="8" fill="#C9A26A"/><path d="M 28 42 Q 40 50 52 42" stroke="#8C1220" stroke-width="4" fill="none"/></g>`;
  } else if (t.includes('hobbes') || t.includes('leviatã') || t.includes('leviata') || t.includes('peste de atenas')) {
    // Leviatã: monstro marinho + cetro
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><ellipse cx="0" cy="0" rx="110" ry="80"/><path d="M 90 -30 L 130 -80 L 120 -20 Z"/></g><ellipse cx="0" cy="0" rx="100" ry="70" fill="#1D3A5D"/><circle cx="-30" cy="-15" r="14" fill="#C9A26A"/><circle cx="30" cy="-15" r="14" fill="#C9A26A"/><circle cx="-30" cy="-15" r="7" fill="#0F233B"/><circle cx="30" cy="-15" r="7" fill="#0F233B"/><path d="M -40 25 Q 0 50 40 25" stroke="#C9A26A" stroke-width="5" fill="none"/><line x1="-40" y1="30" x2="-30" y2="20" stroke="#F4E8C1" stroke-width="3"/><line x1="-20" y1="35" x2="-10" y2="25" stroke="#F4E8C1" stroke-width="3"/><line x1="0" y1="38" x2="10" y2="28" stroke="#F4E8C1" stroke-width="3"/><line x1="20" y1="35" x2="30" y2="25" stroke="#F4E8C1" stroke-width="3"/><text x="0" y="80" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="18">LEVIATÃ</text></g>`;
  } else if (t.includes('kant') || t.includes('imperativo categórico') || t.includes('imperativo categorico') || t.includes('titanic')) {
    // Kant: estrela moral + navio
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><polygon points="0,-100 30,-40 95,-40 42,5 60,70 0,30 -60,70 -42,5 -95,-40 -30,-40"/></g><polygon points="0,-90 25,-38 85,-38 38,3 54,62 0,26 -54,62 -38,3 -85,-38 -25,-38" fill="#4C2D6B"/><text x="0" y="-10" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="22">⚖</text><text x="0" y="25" text-anchor="middle" fill="#F4E8C1" font-family="sans-serif" font-weight="bold" font-size="13">DEVER</text></g>`;
  } else if (t.includes('antígona') || t.includes('antigona')) {
    // Antígona: templo grego + conflito leis
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><polygon points="0,-100 -110,-40 110,-40"/><rect x="-90" y="-40" width="30" height="130" rx="4"/><rect x="-30" y="-40" width="30" height="130" rx="4"/><rect x="30" y="-40" width="30" height="130" rx="4"/><rect x="60" y="-40" width="30" height="130" rx="4"/></g><polygon points="0,-90 -100,-35 100,-35" fill="#C9A26A"/><rect x="-85" y="-35" width="22" height="120" rx="3" fill="#F4E8C1"/><rect x="-25" y="-35" width="22" height="120" rx="3" fill="#F4E8C1"/><rect x="35" y="-35" width="22" height="120" rx="3" fill="#F4E8C1"/><rect x="65" y="-35" width="22" height="120" rx="3" fill="#F4E8C1"/><text x="0" y="-55" text-anchor="middle" fill="#FFF" font-family="serif" font-weight="bold" font-size="16">ΘΕΜΙΣ</text></g>`;
  } else if (t.includes('foucault') || t.includes('prisões') || t.includes('prisoes') || t.includes('vigiar e punir')) {
    // Foucault: panóptico / olho vigilante
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="0" r="85"/></g><circle cx="0" cy="0" r="78" fill="#2C1642"/><ellipse cx="0" cy="0" rx="70" ry="35" fill="#FFF" stroke="#C9A26A" stroke-width="3"/><circle cx="0" cy="0" r="22" fill="#1D3A5D"/><circle cx="0" cy="0" r="10" fill="#C9A26A"/><path d="M -78 0 Q -50 -55 0 -35 Q 50 -55 78 0" stroke="#C9A26A" stroke-width="3" fill="none"/><path d="M -78 0 Q -50 55 0 35 Q 50 55 78 0" stroke="#C9A26A" stroke-width="3" fill="none"/><text x="0" y="75" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="14">VIGIAR E PUNIR</text></g>`;
  } else if (t.includes('hércules') || t.includes('hercules') || t.includes('juiz')) {
    // Juiz Hércules: toga + martelo gigante
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="-80" r="50"/><path d="M -60 110 C -60 10, 60 10, 60 110 Z"/><rect x="50" y="-40" width="80" height="30" rx="8"/><rect x="75" y="-70" width="30" height="40" rx="6"/></g><circle cx="0" cy="-80" r="43" fill="#EFE1BD"/><path d="M -52 110 C -52 18, 52 18, 52 110 Z" fill="#1D3A5D"/><rect x="55" y="-35" width="70" height="24" rx="6" fill="#8C6B3D"/><rect x="78" y="-65" width="24" height="36" rx="4" fill="#6B4D2E"/></g>`;
  } else if (t.includes('rousseau') || t.includes('contrato social')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="-90" r="55"/><path d="M -70 120 C -70 20, 70 20, 70 120 Z"/><rect x="-110" y="40" width="60" height="70" rx="10"/></g><circle cx="0" cy="-90" r="48" fill="#EFE1BD"/><path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#4C2D6B"/><rect x="-102" y="45" width="60" height="65" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="2"/><text x="-72" y="80" text-anchor="middle" fill="#4C2D6B" font-family="serif" font-weight="bold" font-size="9">CONTRATO SOCIAL</text></g>`;

  // ─── CLÁSSICOS ───
  } else if (t.includes('ihering') || t.includes('luta pelo direito')) {
    // Ihering: espada + livro
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-80" y="-60" width="70" height="130" rx="8"/><line x1="40" y1="-100" x2="40" y2="80"/><polygon points="40,-100 25,-70 55,-70"/></g><rect x="-75" y="-55" width="60" height="120" rx="6" fill="#8C1220"/><text x="-45" y="10" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="11">A LUTA</text><line x1="40" y1="-90" x2="40" y2="70" stroke="#C9A26A" stroke-width="8"/><polygon points="40,-90 28,-65 52,-65" fill="#C9A26A"/><circle cx="40" cy="0" r="6" fill="#7C2D2A"/></g>`;
  } else if (t.includes('beccaria') || t.includes('delitos e das penas')) {
    // Beccaria: guilhotina quebrada + livro
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-90" width="180" height="40" rx="6"/><rect x="-30" y="-90" width="60" height="190" rx="4"/></g><rect x="-85" y="-85" width="170" height="32" rx="4" fill="#7C2D2A"/><rect x="-25" y="-85" width="50" height="180" rx="3" fill="#6B4D2E"/><line x1="-85" y1="-50" x2="85" y2="-50" stroke="#C9A26A" stroke-width="4" stroke-dasharray="12 6"/><path d="M -50 30 L -20 60 L 20 60 L 50 30" stroke="#2D4A3E" stroke-width="6" fill="none"/><text x="0" y="100" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="14">HUMANISMO</text></g>`;
  } else if (t.includes('fuller') || t.includes('denunciantes')) {
    // Fuller: tribunal + dilema
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-100" y="-40" width="200" height="130" rx="10"/><polygon points="0,-100 -110,-40 110,-40"/></g><rect x="-95" y="-35" width="190" height="120" rx="8" fill="#451614"/><polygon points="0,-92 -105,-37 105,-37" fill="#7C2D2A"/><line x1="0" y1="-35" x2="0" y2="85" stroke="#C9A26A" stroke-width="4"/><text x="-48" y="30" text-anchor="middle" fill="#2D4A3E" font-family="sans-serif" font-weight="bold" font-size="16">👍</text><text x="48" y="30" text-anchor="middle" fill="#8C1220" font-family="sans-serif" font-weight="bold" font-size="16">👎</text><text x="0" y="-60" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="14">VEREDICTO</text></g>`;
  } else if (t.includes('kafka') || t.includes('processo') && t.includes('franz')) {
    // Kafka: labirinto burocrático
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-90" width="180" height="180" rx="10"/></g><rect x="-85" y="-85" width="170" height="170" rx="8" fill="#2C2C2C"/><path d="M -60 -60 L -60 0 L 0 0 L 0 -60 M 0 0 L 0 60 L 60 60 L 60 0 L 0 0 M -60 0 L -60 60 M 60 -60 L 60 0" stroke="#C9A26A" stroke-width="5" fill="none"/><circle cx="0" cy="0" r="10" fill="#8C1220"/><text x="0" y="75" text-anchor="middle" fill="#F4E8C1" font-family="serif" font-style="italic" font-size="12">O PROCESSO</text></g>`;
  } else if (t.includes('sol é para todos') || t.includes('sol é para') || t.includes('mockingbird') || t.includes('atticus') || t.includes('racismo estrutural')) {
    // Atticus Finch: martelo + pássaro
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="-70" r="50"/><path d="M -60 110 C -60 20, 60 20, 60 110 Z"/><ellipse cx="80" cy="-50" rx="30" ry="20"/></g><circle cx="0" cy="-70" r="43" fill="#EFE1BD"/><path d="M -52 110 C -52 26, 52 26, 52 110 Z" fill="#3D3D3D"/><path d="M -15 25 L 0 60 L 15 25 Z" fill="#C9A26A"/><ellipse cx="80" cy="-50" rx="25" ry="16" fill="#1D5D55"/><polygon points="105,-50 120,-55 120,-45" fill="#C9A26A"/></g>`;
  } else if (t.includes('miseráveis') || t.includes('miserables') || t.includes('jean valjean') || t.includes('victor hugo')) {
    // Les Misérables: corrente quebrada + vela
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><ellipse cx="-50" cy="0" rx="30" ry="30"/><ellipse cx="0" cy="0" rx="30" ry="30"/><ellipse cx="50" cy="0" rx="30" ry="30"/><rect x="70" y="-80" width="20" height="100" rx="4"/></g><ellipse cx="-50" cy="0" rx="24" ry="24" fill="none" stroke="#6B4D2E" stroke-width="8"/><ellipse cx="50" cy="0" rx="24" ry="24" fill="none" stroke="#6B4D2E" stroke-width="8"/><line x1="-20" y1="0" x2="20" y2="0" stroke="#8C1220" stroke-width="6" stroke-dasharray="8 8"/><rect x="73" y="-75" width="14" height="90" rx="3" fill="#F4E8C1"/><ellipse cx="80" cy="-80" rx="8" ry="12" fill="#FFD700" opacity="0.8"/><text x="0" y="60" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="14">LIBERDADE</text></g>`;
  } else if (t.includes('rui barbosa') || t.includes('oratória') || t.includes('oratoria')) {
    // Rui Barbosa: tribuna + pena
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-60" y="-30" width="120" height="120" rx="8"/><polygon points="0,-100 -30,-30 30,-30"/></g><rect x="-55" y="-25" width="110" height="110" rx="6" fill="#451614"/><polygon points="0,-92 -25,-28 25,-28" fill="#C9A26A"/><path d="M -30 20 Q 0 0 30 20 Q 0 40 -30 20 Z" fill="#F4E8C1" stroke="#6B4D2E" stroke-width="2"/><text x="0" y="70" text-anchor="middle" fill="#F4E8C1" font-family="serif" font-weight="bold" font-size="14">TRIBUNA</text></g>`;

  // ─── CURIOSIDADES ───
  } else if (t.includes('hammurabi') || t.includes('olho por olho')) {
    // Código de Hammurabi: tábua de pedra
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><path d="M -70 100 L -70 -60 Q -70 -100 0 -100 Q 70 -100 70 -60 L 70 100 Z"/></g><path d="M -62 92 L -62 -55 Q -62 -92 0 -92 Q 62 -92 62 -55 L 62 92 Z" fill="#6B4D2E"/><line x1="-40" y1="-50" x2="40" y2="-50" stroke="#C9A26A" stroke-width="4"/><line x1="-40" y1="-25" x2="40" y2="-25" stroke="#C9A26A" stroke-width="4"/><line x1="-40" y1="0" x2="40" y2="0" stroke="#C9A26A" stroke-width="4"/><line x1="-40" y1="25" x2="30" y2="25" stroke="#C9A26A" stroke-width="4"/><line x1="-40" y1="50" x2="20" y2="50" stroke="#C9A26A" stroke-width="4"/><text x="0" y="-70" text-anchor="middle" fill="#F4E8C1" font-family="serif" font-weight="bold" font-size="14">𒀭</text></g>`;
  } else if (t.includes('beca') || t.includes('doutor') || t.includes('tradições jurídicas') || t.includes('tradicoes juridicas')) {
    // Beca e Doutor: toga acadêmica + capelo
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><polygon points="0,-100 -80,-60 0,-20 80,-60"/><rect x="-2" y="-100" width="4" height="30"/><path d="M -60 0 C -60 -10, 60 -10, 60 0 L 60 90 L -60 90 Z"/></g><polygon points="0,-92 -72,-56 0,-20 72,-56" fill="#2C2C2C"/><line x1="0" y1="-92" x2="0" y2="-68" stroke="#C9A26A" stroke-width="4"/><circle cx="0" cy="-68" r="5" fill="#C9A26A"/><path d="M -52 2 C -52 -6, 52 -6, 52 2 L 52 82 L -52 82 Z" fill="#1D3A5D"/><path d="M -52 2 C -52 -6, 52 -6, 52 2 L 52 12 C 52 8, -52 8, -52 12 Z" fill="#C9A26A"/></g>`;
  } else if (t.includes('biquíni') || t.includes('bigamia') || t.includes('bizarras')) {
    // Leis Bizarras: martelo com interrogação
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="-20" r="80"/></g><circle cx="0" cy="-20" r="73" fill="#1D5D55"/><text x="0" y="10" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="70">?!</text><rect x="-40" y="65" width="80" height="25" rx="6" fill="#C9A26A" stroke="#FFF" stroke-width="4"/><text x="0" y="83" text-anchor="middle" fill="#0E3631" font-family="sans-serif" font-weight="bold" font-size="12">LEI REAL</text></g>`;
  } else if (t.includes('erro de tradução') || t.includes('constituição de 1824') || t.includes('constituicao de 1824')) {
    // Erro na Constituição 1824: documento com risco vermelho
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-80" y="-90" width="160" height="190" rx="8"/></g><rect x="-75" y="-85" width="150" height="180" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="2"/><text x="0" y="-50" text-anchor="middle" fill="#1D3A5D" font-family="serif" font-weight="bold" font-size="14">CONSTITUIÇÃO</text><text x="0" y="-30" text-anchor="middle" fill="#1D3A5D" font-family="serif" font-weight="bold" font-size="14">DO IMPÉRIO</text><text x="0" y="-10" text-anchor="middle" fill="#6B4D2E" font-family="serif" font-size="12">1824</text><line x1="-50" y1="10" x2="50" y2="40" stroke="#8C1220" stroke-width="8" stroke-linecap="round"/><line x1="50" y1="10" x2="-50" y2="40" stroke="#8C1220" stroke-width="8" stroke-linecap="round"/><text x="0" y="75" text-anchor="middle" fill="#8C1220" font-family="sans-serif" font-weight="bold" font-size="12">ERRO DE TRADUÇÃO</text></g>`;
  } else if (t.includes('galo') || t.includes('porco') || t.includes('animais') && t.includes('réu')) {
    // Julgamentos de Animais: animal com martelo
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><ellipse cx="0" cy="-20" rx="70" ry="60"/><polygon points="-20,50 0,100 20,50"/></g><ellipse cx="0" cy="-20" rx="63" ry="53" fill="#1D5D55"/><circle cx="-18" cy="-30" r="10" fill="#F4E8C1"/><circle cx="18" cy="-30" r="10" fill="#F4E8C1"/><circle cx="-18" cy="-30" r="5" fill="#2C2C2C"/><circle cx="18" cy="-30" r="5" fill="#2C2C2C"/><path d="M -10 0 Q 0 10 10 0" stroke="#C9A26A" stroke-width="3" fill="none"/><polygon points="-15,50 0,90 15,50" fill="#C9A26A"/><rect x="50" y="-60" width="40" height="15" rx="4" fill="#6B4D2E"/><rect x="62" y="-75" width="16" height="20" rx="3" fill="#6B4D2E"/></g>`;
  } else if (t.includes('tiradentes') || t.includes('ordenações filipinas')) {
    // Tiradentes: forca + bandeira
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><line x1="-40" y1="-100" x2="-40" y2="90"/><line x1="-40" y1="-100" x2="40" y2="-100"/><line x1="40" y1="-100" x2="40" y2="-60"/><rect x="50" y="-80" width="60" height="80" rx="4"/></g><line x1="-40" y1="-92" x2="-40" y2="82" stroke="#6B4D2E" stroke-width="10"/><line x1="-40" y1="-92" x2="40" y2="-92" stroke="#6B4D2E" stroke-width="8"/><circle cx="40" cy="-55" r="12" fill="none" stroke="#C9A26A" stroke-width="4"/><rect x="55" y="-75" width="50" height="70" rx="3" fill="#2D4A3E"/><polygon points="80,-55 68,-40 92,-40" fill="#FFF"/></g>`;

  // ─── STF ───
  } else if (t.includes('algemas') || t.includes('súmula vinculante 11')) {
    // Algemas: algemas abertas
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="-50" cy="0" r="45"/><circle cx="50" cy="0" r="45"/><line x1="-5" y1="0" x2="5" y2="0"/></g><circle cx="-50" cy="0" r="38" fill="none" stroke="#A0A0A0" stroke-width="10"/><circle cx="50" cy="0" r="38" fill="none" stroke="#A0A0A0" stroke-width="10"/><line x1="-12" y1="0" x2="12" y2="0" stroke="#A0A0A0" stroke-width="8"/><path d="M -50 -38 L -60 -55" stroke="#A0A0A0" stroke-width="6" stroke-linecap="round"/><path d="M 50 -38 L 60 -55" stroke="#A0A0A0" stroke-width="6" stroke-linecap="round"/><text x="0" y="65" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="14">DIGNIDADE</text></g>`;
  } else if (t.includes('censura') || t.includes('biografias') || t.includes('liberdade de expressão') || t.includes('liberdade de expressao')) {
    // Liberdade de Expressão: megafone + livro aberto
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><polygon points="-90,-30 -40,-60 -40,60 -90,30"/><rect x="-40" y="-60" width="80" height="120" rx="6"/><path d="M 50 -40 Q 90 0 50 40"/></g><polygon points="-85,-25 -42,-55 -42,55 -85,25" fill="#1D3A5D"/><rect x="-35" y="-55" width="35" height="110" rx="4" fill="#F4E8C1"/><rect x="0" y="-55" width="35" height="110" rx="4" fill="#E8D9B5"/><path d="M 50 -35 Q 82 0 50 35" stroke="#C9A26A" stroke-width="5" fill="none"/><path d="M 55 -50 Q 95 0 55 50" stroke="#C9A26A" stroke-width="3" fill="none" opacity="0.5"/></g>`;
  } else if (t.includes('adi') || t.includes('inconstitucionalidade') || t.includes('demarcação de poderes')) {
    // ADI: martelo quebrando lei
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-80" y="-40" width="100" height="130" rx="8"/><rect x="30" y="-100" width="60" height="30" rx="8"/><rect x="48" y="-70" width="24" height="80" rx="4"/></g><rect x="-75" y="-35" width="90" height="120" rx="6" fill="#F4E8C1" stroke="#8C1220" stroke-width="3"/><text x="-30" y="10" text-anchor="middle" fill="#8C1220" font-family="sans-serif" font-weight="900" font-size="20">X</text><rect x="33" y="-95" width="54" height="24" rx="6" fill="#6B4D2E"/><rect x="50" y="-68" width="20" height="70" rx="3" fill="#8C6B3D"/><text x="-30" y="65" text-anchor="middle" fill="#1D3A5D" font-family="sans-serif" font-weight="bold" font-size="12">INCONST.</text></g>`;
  } else if (t.includes('ellwanger') || t.includes('discurso de ódio') || t.includes('discurso de odio')) {
    // Ellwanger: balança com megafone vs escudo
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><line x1="0" y1="-90" x2="0" y2="50"/><line x1="-80" y1="-40" x2="80" y2="-40"/><path d="M -90 -40 L -70 30 L -110 30 Z"/><path d="M 90 -40 L 70 30 L 110 30 Z"/></g><line x1="0" y1="-82" x2="0" y2="42" stroke="#C9A26A" stroke-width="8"/><line x1="-75" y1="-38" x2="75" y2="-38" stroke="#C9A26A" stroke-width="5"/><path d="M -85 -38 L -68 25 L -102 25 Z" fill="#8C1220"/><path d="M 85 -38 L 68 25 L 102 25 Z" fill="#1D3A5D"/><text x="-85" y="55" text-anchor="middle" fill="#F4E8C1" font-family="sans-serif" font-weight="bold" font-size="11">ÓDIO</text><text x="85" y="55" text-anchor="middle" fill="#F4E8C1" font-family="sans-serif" font-weight="bold" font-size="11">DIGNIDADE</text></g>`;
  } else if (t.includes('hc') || t.includes('lula') || t.includes('brasil parou')) {
    // HC Lula: gavel partido + constituição
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-60" width="80" height="120" rx="8"/><circle cx="60" cy="-40" r="40"/></g><rect x="-85" y="-55" width="70" height="110" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="2"/><text x="-50" y="-15" text-anchor="middle" fill="#1D3A5D" font-family="serif" font-weight="bold" font-size="14">CF/88</text><text x="-50" y="10" text-anchor="middle" fill="#8C1220" font-family="sans-serif" font-weight="bold" font-size="11">ART. 5°</text><circle cx="60" cy="-40" r="34" fill="#1D3A5D"/><text x="60" y="-30" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="14">HC</text></g>`;
  } else if (t.includes('judicialização') || t.includes('judicializacao') || t.includes('saúde') || t.includes('remédios') || t.includes('remedios')) {
    // Saúde: cruz médica + martelo
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-30" y="-90" width="60" height="180" rx="10"/><rect x="-90" y="-30" width="180" height="60" rx="10"/></g><rect x="-25" y="-85" width="50" height="170" rx="8" fill="#8C1220"/><rect x="-85" y="-25" width="170" height="50" rx="8" fill="#8C1220"/><circle cx="0" cy="0" r="15" fill="#FFF"/><text x="0" y="6" text-anchor="middle" fill="#8C1220" font-family="sans-serif" font-weight="bold" font-size="16">⚖</text></g>`;
  } else if (t.includes('mutação constitucional') || t.includes('mutacao') || t.includes('mudar de ideia')) {
    // Mutação: DNA + constituição
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><path d="M -30 -90 Q 30 -45 -30 0 Q 30 45 -30 90" /><path d="M 30 -90 Q -30 -45 30 0 Q -30 45 30 90"/></g><path d="M -30 -85 Q 25 -42 -30 2 Q 25 46 -30 85" stroke="#C9A26A" stroke-width="6" fill="none"/><path d="M 30 -85 Q -25 -42 30 2 Q -25 46 30 85" stroke="#1D3A5D" stroke-width="6" fill="none"/><line x1="-15" y1="-65" x2="15" y2="-65" stroke="#8C1220" stroke-width="4"/><line x1="-15" y1="-20" x2="15" y2="-20" stroke="#8C1220" stroke-width="4"/><line x1="-15" y1="25" x2="15" y2="25" stroke="#8C1220" stroke-width="4"/><line x1="-15" y1="65" x2="15" y2="65" stroke="#8C1220" stroke-width="4"/></g>`;
  } else if (t.includes('uniões homoafetivas') || t.includes('unioes homoafetivas') || t.includes('homoafetivas')) {
    // Uniões: dois anéis entrelaçados + arco-íris
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="-35" cy="0" r="55"/><circle cx="35" cy="0" r="55"/></g><circle cx="-35" cy="0" r="48" fill="none" stroke="#C9A26A" stroke-width="8"/><circle cx="35" cy="0" r="48" fill="none" stroke="#C9A26A" stroke-width="8"/><path d="M -60 -70 Q 0 -110 60 -70" stroke="#E74C3C" stroke-width="4" fill="none"/><path d="M -55 -78 Q 0 -115 55 -78" stroke="#F39C12" stroke-width="4" fill="none"/><path d="M -50 -86 Q 0 -120 50 -86" stroke="#2ECC71" stroke-width="4" fill="none"/><path d="M -45 -94 Q 0 -125 45 -94" stroke="#3498DB" stroke-width="4" fill="none"/><text x="0" y="70" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="14">IGUALDADE</text></g>`;
  } else if (t.includes('3 decisões') || t.includes('3 decisoes') || t.includes('stf em foco')) {
    // 3 decisões: três gavetas/folders
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="12" fill="#FFF" stroke-linejoin="round"><rect x="-100" y="-70" width="65" height="140" rx="6"/><rect x="-20" y="-90" width="65" height="160" rx="6"/><rect x="60" y="-70" width="65" height="140" rx="6"/></g><rect x="-95" y="-65" width="55" height="130" rx="4" fill="#1D3A5D"/><text x="-68" y="5" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="20">1</text><rect x="-15" y="-85" width="55" height="150" rx="4" fill="#8C1220"/><text x="12" y="5" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="20">2</text><rect x="65" y="-65" width="55" height="130" rx="4" fill="#2D4A3E"/><text x="92" y="5" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="20">3</text></g>`;

  // ─── ATUALIDADES JURÍDICAS ───
  } else if (t.includes('cibernéticos') || t.includes('ciberneticos') || t.includes('pix') || t.includes('carolina dieckmann') || t.includes('golpes')) {
    // Crimes Cibernéticos: tela com caveira hacker
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-70" width="180" height="130" rx="10"/><rect x="-40" y="60" width="80" height="15" rx="4"/></g><rect x="-85" y="-65" width="170" height="120" rx="8" fill="#0F172A"/><circle cx="0" cy="-25" r="30" fill="none" stroke="#00FF41" stroke-width="3"/><circle cx="-12" cy="-32" r="6" fill="#00FF41"/><circle cx="12" cy="-32" r="6" fill="#00FF41"/><path d="M -15 -12 Q 0 0 15 -12" stroke="#00FF41" stroke-width="3" fill="none"/><text x="0" y="35" text-anchor="middle" fill="#00FF41" font-family="monospace" font-weight="bold" font-size="12">HACK3D</text><rect x="-35" y="62" width="70" height="10" rx="3" fill="#3D3D3D"/></g>`;
  } else if (t.includes('gamers') || t.includes('e-sports') || t.includes('esports')) {
    // E-sports: controle + contrato
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-40" width="180" height="90" rx="30"/></g><rect x="-85" y="-35" width="170" height="80" rx="26" fill="#1E3A8A"/><circle cx="-40" cy="-10" r="15" fill="#0F172A"/><line x1="-40" y1="-22" x2="-40" y2="2" stroke="#C9A26A" stroke-width="4"/><line x1="-52" y1="-10" x2="-28" y2="-10" stroke="#C9A26A" stroke-width="4"/><circle cx="30" cy="-18" r="7" fill="#E74C3C"/><circle cx="48" cy="-10" r="7" fill="#2ECC71"/><circle cx="30" cy="-2" r="7" fill="#3498DB"/><circle cx="12" cy="-10" r="7" fill="#F39C12"/><text x="0" y="65" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="14">E-SPORTS</text></g>`;
  } else if (t.includes('inteligência artificial') || t.includes('inteligencia artificial') || t.includes('algoritmos') || t.includes('ia ')) {
    // IA: cérebro + circuito
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><ellipse cx="0" cy="-10" rx="85" ry="70"/></g><ellipse cx="0" cy="-10" rx="78" ry="63" fill="#1E3A8A"/><path d="M -40 -40 Q -20 -60 0 -40 Q 20 -60 40 -40 Q 50 -20 40 0 Q 30 20 0 30 Q -30 20 -40 0 Q -50 -20 -40 -40 Z" fill="#0F172A" stroke="#00D4FF" stroke-width="2"/><circle cx="-20" cy="-20" r="5" fill="#00D4FF"/><circle cx="20" cy="-20" r="5" fill="#00D4FF"/><circle cx="0" cy="5" r="5" fill="#00D4FF"/><line x1="-20" y1="-20" x2="0" y2="5" stroke="#00D4FF" stroke-width="2"/><line x1="20" y1="-20" x2="0" y2="5" stroke="#00D4FF" stroke-width="2"/><line x1="-20" y1="-20" x2="20" y2="-20" stroke="#00D4FF" stroke-width="2"/><text x="0" y="60" text-anchor="middle" fill="#00D4FF" font-family="monospace" font-weight="bold" font-size="14">A.I.</text></g>`;
  } else if (t.includes('apostas') || t.includes('bets') || t.includes('esportivas')) {
    // Apostas: dado + lei
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-70" y="-70" width="140" height="140" rx="18" transform="rotate(15)"/></g><rect x="-63" y="-63" width="126" height="126" rx="14" fill="#8C1220" transform="rotate(15)"/><circle cx="-20" cy="-30" r="8" fill="#FFF"/><circle cx="20" cy="-30" r="8" fill="#FFF"/><circle cx="0" cy="0" r="8" fill="#FFF"/><circle cx="-20" cy="30" r="8" fill="#FFF"/><circle cx="20" cy="30" r="8" fill="#FFF"/><text x="0" y="85" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="14">BETS</text></g>`;
  } else if (t.includes('uber') || t.includes('ifood') || t.includes('plataformas digitais') || t.includes('vínculo')) {
    // Trabalho digital: smartphone + moto
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-45" y="-90" width="90" height="160" rx="12"/></g><rect x="-40" y="-85" width="80" height="150" rx="10" fill="#0F172A"/><rect x="-35" y="-75" width="70" height="110" rx="4" fill="#1E3A8A"/><circle cx="0" cy="52" r="8" fill="#3D3D3D" stroke="#C9A26A" stroke-width="2"/><circle cx="-10" cy="-40" r="5" fill="#2ECC71"/><circle cx="0" cy="-20" r="12" fill="#C9A26A"/><text x="0" y="-16" text-anchor="middle" fill="#0F172A" font-family="sans-serif" font-weight="bold" font-size="10">APP</text><path d="M -20 10 L 20 10 L 15 30 L -15 30 Z" fill="#FFF" opacity="0.5"/></g>`;

  // ─── LEIS (extras) ───
  } else if (t.includes('consumidor') || t.includes('cdc') || t.includes('compras online')) {
    // CDC: carrinho de compras + escudo
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-80" y="-50" width="110" height="90" rx="8"/><circle cx="-50" cy="55" r="18"/><circle cx="0" cy="55" r="18"/><path d="M 50 -80 L 50 20 Q 50 80 90 80 L 90 20 Q 90 -80 50 -80 Z"/></g><rect x="-75" y="-45" width="100" height="80" rx="6" fill="#2D4A3E"/><circle cx="-50" cy="55" r="12" fill="#6B4D2E"/><circle cx="0" cy="55" r="12" fill="#6B4D2E"/><path d="M 52 -75 L 52 18 Q 52 72 85 72 L 85 18 Q 85 -75 52 -75 Z" fill="#1D3A5D"/><text x="68" y="10" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="14">CDC</text></g>`;
  } else if (t.includes('o que é uma lei') || t.includes('norma jurídica') || t.includes('norma juridica') || t.includes('segredos da norma')) {
    // O que é uma Lei: pergaminho + selo
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-70" y="-90" width="140" height="180" rx="8"/><circle cx="0" cy="60" r="25"/></g><rect x="-65" y="-85" width="130" height="170" rx="6" fill="#F4E8C1"/><line x1="-45" y1="-55" x2="45" y2="-55" stroke="#2C2C2C" stroke-width="3"/><line x1="-45" y1="-35" x2="45" y2="-35" stroke="#2C2C2C" stroke-width="3"/><line x1="-45" y1="-15" x2="45" y2="-15" stroke="#2C2C2C" stroke-width="3"/><line x1="-45" y1="5" x2="30" y2="5" stroke="#2C2C2C" stroke-width="3"/><circle cx="0" cy="60" r="20" fill="#8C1220"/><text x="0" y="65" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="12">LEI</text></g>`;

  // ─── Matched titles from earlier session ───
  } else if (t.includes('victor nunes leal') || t.includes('súmula') || t.includes('sumula')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" fill="#FFF"><circle cx="0" cy="-90" r="55"/><path d="M -70 120 C -70 20, 70 20, 70 120 Z"/><rect x="-110" y="40" width="60" height="70" rx="10"/></g><circle cx="0" cy="-90" r="48" fill="#EFE1BD"/><path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#1D3A5D"/><path d="M -15 28 L 0 65 L 15 28 Z" fill="#C9A26A"/><rect x="-102" y="45" width="60" height="65" rx="6" fill="#C9A26A" stroke="#FFF" stroke-width="2"/><text x="-72" y="80" text-anchor="middle" fill="#1D3A5D" font-family="sans-serif" font-weight="bold" font-size="11">SÚMULAS STF</text></g>`;
  } else if (t.includes('legalidade') || t.includes('estado de direito')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="-90" r="55"/><path d="M -70 120 C -70 20, 70 20, 70 120 Z"/><rect x="-100" y="40" width="55" height="65" rx="8"/></g><circle cx="0" cy="-90" r="48" fill="#EFE1BD"/><path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#2D4A3E"/><rect x="-95" y="45" width="50" height="60" rx="6" fill="#8C1220"/><text x="-70" y="80" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="12">LEI</text></g>`;
  } else if (t.includes('lei formal') || t.includes('lei material')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="12" fill="#FFF" stroke-linejoin="round"><rect x="-105" y="-70" width="90" height="150" rx="8"/><rect x="15" y="-70" width="90" height="150" rx="8"/></g><rect x="-100" y="-65" width="80" height="140" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="2"/><text x="-60" y="0" text-anchor="middle" fill="#8C1220" font-family="sans-serif" font-weight="bold" font-size="14">FORMAL</text><rect x="20" y="-65" width="80" height="140" rx="6" fill="#F4E8C1" stroke="#1D3A5D" stroke-width="2"/><text x="60" y="0" text-anchor="middle" fill="#1D3A5D" font-family="sans-serif" font-weight="bold" font-size="14">MATERIAL</text></g>`;
  } else if (t.includes('menino') || t.includes('inteligente') || t.includes('enigma')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round" stroke-linecap="round"><circle cx="0" cy="-90" r="55"/><path d="M -70 120 C -70 20, 70 20, 70 120 Z"/><circle cx="80" cy="20" r="35"/></g><circle cx="0" cy="-90" r="48" fill="#EFE1BD"/><path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#1D5D55"/><circle cx="80" cy="20" r="28" fill="none" stroke="#C9A26A" stroke-width="8"/><line x1="100" y1="40" x2="130" y2="70" stroke="#C9A26A" stroke-width="10" stroke-linecap="round"/></g>`;
  } else if (t.includes('sherlock') || t.includes('expresso') || t.includes('assassinato') || t.includes('agatha')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="-90" r="55"/><path d="M -70 120 C -70 20, 70 20, 70 120 Z"/><rect x="-100" y="30" width="55" height="70" rx="6"/></g><circle cx="0" cy="-90" r="48" fill="#EFE1BD"/><path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#2C2C2C"/><rect x="-95" y="35" width="45" height="60" rx="4" fill="#F4E8C1"/><text x="-72" y="70" text-anchor="middle" fill="#8C1220" font-family="sans-serif" font-weight="bold" font-size="10">PROVAS</text></g>`;
  } else if (t.includes('habeas corpus')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="-90" r="55"/><path d="M -70 120 C -70 20, 70 20, 70 120 Z"/><rect x="-100" y="30" width="60" height="75" rx="6"/></g><circle cx="0" cy="-90" r="48" fill="#EFE1BD"/><path d="M -62 120 C -62 28, 62 28, 62 120 Z" fill="#1D3A5D"/><rect x="-95" y="35" width="50" height="65" rx="4" fill="#FFF" stroke="#1D3A5D" stroke-width="2"/><text x="-70" y="72" text-anchor="middle" fill="#1D3A5D" font-family="sans-serif" font-weight="bold" font-size="10">HABEAS CORPUS</text></g>`;
  } else if (t.includes('pétreas') || t.includes('petreas') || t.includes('cláusula')) {
    centerPropSvg = `<g filter="url(#shadow)"><path d="M -90 110 L -90 -60 Q -90 -100 0 -100 Q 90 -100 90 -60 L 90 110 Z" fill="#FFF" stroke="#FFF" stroke-width="14" stroke-linejoin="round"/><path d="M -80 100 L -80 -55 Q -80 -90 0 -90 Q 80 -90 80 -55 L 80 100 Z" fill="#4A4A4A" stroke="#2C2C2C" stroke-width="4"/><path d="M 0 -70 L -45 -10 L 0 -10 L 0 50 L 45 -10 L 0 -10 Z" fill="#C9A26A"/><text x="0" y="30" text-anchor="middle" fill="#FFF" font-family="serif" font-weight="bold" font-size="22">CF/88</text><text x="0" y="70" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="16">ART. 60 §4º</text></g>`;
  } else if (t.includes('decreto') || t.includes('portaria') || t.includes('resolução') || t.includes('resolucao') || t.includes('normas infralegais')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="12" fill="#FFF" stroke-linejoin="round"><rect x="-110" y="-70" width="80" height="150" rx="8"/><rect x="-35" y="-90" width="80" height="160" rx="8"/><rect x="40" y="-70" width="80" height="150" rx="8"/></g><rect x="-105" y="-65" width="70" height="140" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="2"/><circle cx="-70" cy="40" r="16" fill="#8C1220"/><rect x="-30" y="-85" width="70" height="150" rx="6" fill="#FFF" stroke="#2C2C2C" stroke-width="2"/><circle cx="5" cy="30" r="18" fill="#1D3A5D"/><rect x="45" y="-65" width="70" height="140" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="2"/><circle cx="80" cy="40" r="16" fill="#2D4A3E"/></g>`;
  } else if (t.includes('hierarquia') || t.includes('manda em quem')) {
    centerPropSvg = `<g filter="url(#shadow)"><polygon points="0,-110 -130,110 130,110" fill="#FFF" stroke="#FFF" stroke-width="14" stroke-linejoin="round"/><polygon points="0,-100 -120,100 120,100" fill="#2C2C2C"/><polygon points="0,-100 -40,-30 40,-30" fill="#C9A26A"/><text x="0" y="-55" text-anchor="middle" fill="#1B3028" font-family="sans-serif" font-weight="bold" font-size="16">CF/88</text><polygon points="-40,-30 40,-30 80,35 -80,35" fill="#8C1220"/><text x="0" y="10" text-anchor="middle" fill="#FFF" font-family="sans-serif" font-weight="bold" font-size="16">LEIS</text><polygon points="-80,35 80,35 120,100 -120,100" fill="#1D3A5D"/><text x="0" y="75" text-anchor="middle" fill="#FFF" font-family="sans-serif" font-weight="bold" font-size="14">DECRETOS</text></g>`;
  } else if (t.includes('revogação') || t.includes('revogacao') || t.includes('morte')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-70" width="180" height="150" rx="10"/></g><rect x="-85" y="-65" width="170" height="140" rx="8" fill="#8C1220"/><rect x="-70" y="-20" width="140" height="45" rx="6" fill="#FFF" stroke="#B91C1C" stroke-width="4" transform="rotate(-12)"/><text x="0" y="10" text-anchor="middle" fill="#B91C1C" font-family="sans-serif" font-weight="900" font-size="18" transform="rotate(-12)">REVOGADA</text></g>`;
  } else if (t.includes('3 v') || t.includes('vigência') || t.includes('eficácia') || t.includes('validade')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="12" fill="#FFF" stroke-linejoin="round"><circle cx="-85" cy="0" r="45"/><circle cx="0" cy="-40" r="45"/><circle cx="85" cy="0" r="45"/></g><circle cx="-85" cy="0" r="40" fill="#1D3A5D"/><text x="-85" y="6" text-anchor="middle" fill="#FFF" font-family="sans-serif" font-weight="bold" font-size="13">VALIDADE</text><circle cx="0" cy="-40" r="40" fill="#8C1220"/><text x="0" y="-34" text-anchor="middle" fill="#FFF" font-family="sans-serif" font-weight="bold" font-size="13">VIGÊNCIA</text><circle cx="85" cy="0" r="40" fill="#2D4A3E"/><text x="85" y="6" text-anchor="middle" fill="#FFF" font-family="sans-serif" font-weight="bold" font-size="13">EFICÁCIA</text></g>`;
  } else if (t.includes('caput') || t.includes('inciso') || t.includes('parágrafo') || t.includes('paragrafo') || t.includes('alínea') || t.includes('alinea') || t.includes('desvendando o artigo') || t.includes('estrutura da lei')) {
    centerPropSvg = `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="12" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-80" width="180" height="160" rx="10"/></g><rect x="-85" y="-75" width="170" height="150" rx="8" fill="#F4E8C1" stroke="#C9A26A" stroke-width="3"/><rect x="-70" y="-60" width="140" height="30" rx="4" fill="#C9A26A"/><text x="0" y="-40" text-anchor="middle" fill="#1B3028" font-family="sans-serif" font-weight="bold" font-size="16">ARTIGO 1º (CAPUT)</text><text x="-65" y="-5" fill="#2C2C2C" font-family="sans-serif" font-weight="bold" font-size="15">§ 1º Parágrafo Único</text><text x="-65" y="25" fill="#8C1220" font-family="sans-serif" font-weight="bold" font-size="15">I - Inciso Primeiro</text><text x="-65" y="55" fill="#1D3A5D" font-family="sans-serif" font-weight="bold" font-size="15">a) Alínea Primeira</text></g>`;
  } else {
    // Fallback INTELIGENTE: gera ilustração baseada na CATEGORIA com variação por hash do título
    const hash = t.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const variant = hash % 5;
    
    if (cat.includes('stf')) {
      // STF variants: diferentes composições jurídicas
      const stfVariants = [
        // Martelo + Constituição
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-70" y="-60" width="80" height="120" rx="8"/><rect x="30" y="-80" width="60" height="25" rx="8"/><rect x="48" y="-55" width="24" height="70" rx="4"/></g><rect x="-65" y="-55" width="70" height="110" rx="6" fill="#F4E8C1" stroke="#1D3A5D" stroke-width="3"/><text x="-30" y="5" text-anchor="middle" fill="#1D3A5D" font-family="serif" font-weight="bold" font-size="16">CF</text><rect x="33" y="-76" width="54" height="20" rx="6" fill="#6B4D2E"/><rect x="50" y="-52" width="20" height="62" rx="3" fill="#8C6B3D"/></g>`,
        // Toga + 11 cadeiras
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="12" fill="#FFF" stroke-linejoin="round"><rect x="-100" y="-20" width="200" height="100" rx="8"/><polygon points="0,-80 -110,-20 110,-20"/></g><rect x="-95" y="-16" width="190" height="90" rx="6" fill="#1D3A5D"/><polygon points="0,-74 -105,-18 105,-18" fill="#0F233B"/><text x="0" y="-38" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="22">STF</text><g fill="#C9A26A">${Array.from({length:11},(_,i)=>`<circle cx="${-80+i*16}" cy="30" r="6"/>`).join('')}</g></g>`,
        // Plenário com 3 pilares
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-100" y="-10" width="30" height="100" rx="4"/><rect x="-15" y="-10" width="30" height="100" rx="4"/><rect x="70" y="-10" width="30" height="100" rx="4"/><rect x="-110" y="-30" width="220" height="25" rx="4"/></g><rect x="-95" y="-5" width="22" height="90" rx="3" fill="#F4E8C1"/><rect x="-10" y="-5" width="22" height="90" rx="3" fill="#F4E8C1"/><rect x="75" y="-5" width="22" height="90" rx="3" fill="#F4E8C1"/><rect x="-105" y="-26" width="210" height="18" rx="3" fill="#C9A26A"/><text x="0" y="-12" text-anchor="middle" fill="#1D3A5D" font-family="serif" font-weight="bold" font-size="14">SUPREMO TRIBUNAL</text></g>`,
        // Escudo da República
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><path d="M 0 -90 L -80 -40 L -80 40 Q -80 110 0 110 Q 80 110 80 40 L 80 -40 Z"/></g><path d="M 0 -80 L -72 -34 L -72 36 Q -72 100 0 100 Q 72 100 72 36 L 72 -34 Z" fill="#1D3A5D"/><text x="0" y="10" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="28">⚖</text><text x="0" y="60" text-anchor="middle" fill="#FFF" font-family="sans-serif" font-weight="bold" font-size="14">JUSTIÇA</text></g>`,
        // Livro aberto + gavel
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-50" width="80" height="110" rx="6"/><rect x="10" y="-50" width="80" height="110" rx="6"/></g><rect x="-85" y="-45" width="70" height="100" rx="4" fill="#F4E8C1"/><rect x="15" y="-45" width="70" height="100" rx="4" fill="#E8D9B5"/><line x1="-65" y1="-20" x2="-25" y2="-20" stroke="#2C2C2C" stroke-width="3"/><line x1="-65" y1="0" x2="-25" y2="0" stroke="#2C2C2C" stroke-width="3"/><line x1="25" y1="-20" x2="75" y2="-20" stroke="#2C2C2C" stroke-width="3"/><line x1="25" y1="0" x2="75" y2="0" stroke="#2C2C2C" stroke-width="3"/><text x="0" y="80" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="14">JURISPRUDÊNCIA</text></g>`,
      ];
      centerPropSvg = stfVariants[variant];
    } else if (cat.includes('filosofia')) {
      const filoVariants = [
        // Coruja da sabedoria
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><ellipse cx="0" cy="-10" rx="70" ry="80"/><polygon points="-30,70 0,100 30,70"/></g><ellipse cx="0" cy="-10" rx="63" ry="73" fill="#2C1642"/><circle cx="-22" cy="-25" r="20" fill="#F4E8C1"/><circle cx="22" cy="-25" r="20" fill="#F4E8C1"/><circle cx="-22" cy="-25" r="10" fill="#4C2D6B"/><circle cx="22" cy="-25" r="10" fill="#4C2D6B"/><polygon points="0,-10 -10,5 10,5" fill="#C9A26A"/><polygon points="-28,65 0,92 28,65" fill="#4C2D6B"/></g>`,
        // Pensador de Rodin
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="-70" r="40"/><path d="M -40 -30 L -50 60 L 50 60 L 40 -30 Z"/><path d="M 30 -50 L 55 -70 L 40 -30 Z"/></g><circle cx="0" cy="-70" r="34" fill="#EFE1BD"/><path d="M -35 -28 L -44 55 L 44 55 L 35 -28 Z" fill="#4C2D6B"/><path d="M 28 -48 L 50 -65 L 36 -28 Z" fill="#EFE1BD"/><text x="0" y="80" text-anchor="middle" fill="#C9A26A" font-family="serif" font-style="italic" font-size="14">PENSO...</text></g>`,
        // Yin-Yang jurídico
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="0" r="80"/></g><circle cx="0" cy="0" r="73" fill="#4C2D6B"/><path d="M 0 -73 A 73 73 0 0 1 0 73 A 36.5 36.5 0 0 1 0 0 A 36.5 36.5 0 0 0 0 -73 Z" fill="#F4E8C1"/><circle cx="0" cy="-36" r="12" fill="#4C2D6B"/><circle cx="0" cy="36" r="12" fill="#F4E8C1"/><text x="0" y="-34" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="10">LEI</text><text x="0" y="40" text-anchor="middle" fill="#4C2D6B" font-family="serif" font-weight="bold" font-size="10">MORAL</text></g>`,
        // Ampulheta do tempo
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><path d="M -50 -90 L 50 -90 L 10 0 L 50 90 L -50 90 L -10 0 Z"/></g><path d="M -44 -84 L 44 -84 L 8 0 L 44 84 L -44 84 L -8 0 Z" fill="#2C1642"/><path d="M -30 -84 L 30 -84 L 5 -20 L -5 -20 Z" fill="#C9A26A" opacity="0.7"/><path d="M -5 20 L 5 20 L 25 84 L -25 84 Z" fill="#C9A26A" opacity="0.4"/></g>`,
        // Árvore do conhecimento
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-12" y="0" width="24" height="90" rx="4"/><circle cx="0" cy="-40" r="65"/></g><rect x="-8" y="4" width="16" height="82" rx="3" fill="#6B4D2E"/><circle cx="0" cy="-40" r="58" fill="#2C1642"/><circle cx="-25" cy="-55" r="15" fill="#4C2D6B"/><circle cx="25" cy="-55" r="15" fill="#4C2D6B"/><circle cx="0" cy="-30" r="15" fill="#4C2D6B"/><circle cx="-35" cy="-30" r="12" fill="#4C2D6B"/><circle cx="35" cy="-30" r="12" fill="#4C2D6B"/><text x="0" y="-28" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="10">φ</text></g>`,
      ];
      centerPropSvg = filoVariants[variant];
    } else if (cat.includes('clássicos') || cat.includes('classicos')) {
      const clasVariants = [
        // Livro antigo aberto
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><path d="M 0 -70 L -90 -50 L -90 70 L 0 50 L 90 70 L 90 -50 Z"/></g><path d="M 0 -62 L -82 -44 L -82 62 L 0 44 Z" fill="#451614"/><path d="M 0 -62 L 82 -44 L 82 62 L 0 44 Z" fill="#5C1E1B"/><line x1="-65" y1="-20" x2="-15" y2="-28" stroke="#C9A26A" stroke-width="3"/><line x1="-65" y1="0" x2="-15" y2="-8" stroke="#C9A26A" stroke-width="3"/><line x1="15" y1="-28" x2="65" y2="-20" stroke="#C9A26A" stroke-width="3"/><line x1="15" y1="-8" x2="65" y2="0" stroke="#C9A26A" stroke-width="3"/></g>`,
        // Máscara de teatro
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="-40" cy="0" r="50"/><circle cx="40" cy="0" r="50"/></g><circle cx="-40" cy="0" r="43" fill="#F4E8C1"/><circle cx="-52" cy="-12" r="8" fill="#451614"/><circle cx="-28" cy="-12" r="8" fill="#451614"/><path d="M -55 18 Q -40 30 -25 18" stroke="#451614" stroke-width="4" fill="none"/><circle cx="40" cy="0" r="43" fill="#F4E8C1"/><circle cx="28" cy="-12" r="8" fill="#451614"/><circle cx="52" cy="-12" r="8" fill="#451614"/><path d="M 25 18 Q 40 8 55 18" stroke="#451614" stroke-width="4" fill="none"/></g>`,
        // Pena e tinteiro
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><path d="M 0 -100 Q 20 -40 10 60 L -10 60 Q -20 -40 0 -100 Z"/><rect x="-40" y="50" width="80" height="50" rx="8"/></g><path d="M 0 -92 Q 16 -38 8 55 L -8 55 Q -16 -38 0 -92 Z" fill="#C9A26A"/><rect x="-35" y="54" width="70" height="42" rx="6" fill="#2C2C2C"/><ellipse cx="0" cy="54" rx="25" ry="8" fill="#1D3A5D"/></g>`,
        // Coluna grega
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-40" y="-90" width="80" height="20" rx="4"/><rect x="-30" y="-70" width="60" height="140" rx="4"/><rect x="-45" y="70" width="90" height="20" rx="4"/></g><rect x="-36" y="-86" width="72" height="14" rx="3" fill="#C9A26A"/><rect x="-26" y="-66" width="18" height="132" rx="3" fill="#F4E8C1"/><rect x="-4" y="-66" width="18" height="132" rx="3" fill="#E8D9B5"/><rect x="14" y="-66" width="18" height="132" rx="3" fill="#F4E8C1"/><rect x="-40" y="72" width="82" height="14" rx="3" fill="#C9A26A"/></g>`,
        // Pergaminho enrolado
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-70" y="-80" width="140" height="160" rx="8"/><ellipse cx="-70" cy="0" rx="15" ry="80"/><ellipse cx="70" cy="0" rx="15" ry="80"/></g><rect x="-65" y="-75" width="130" height="150" rx="6" fill="#F4E8C1"/><ellipse cx="-65" cy="0" rx="10" ry="75" fill="#E8D9B5"/><ellipse cx="65" cy="0" rx="10" ry="75" fill="#E8D9B5"/><line x1="-40" y1="-40" x2="40" y2="-40" stroke="#6B4D2E" stroke-width="3"/><line x1="-40" y1="-15" x2="40" y2="-15" stroke="#6B4D2E" stroke-width="3"/><line x1="-40" y1="10" x2="30" y2="10" stroke="#6B4D2E" stroke-width="3"/></g>`,
      ];
      centerPropSvg = clasVariants[variant];
    } else if (cat.includes('curiosidades')) {
      const curVariants = [
        // Lupa sobre documento
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-80" y="-70" width="120" height="150" rx="8"/><circle cx="50" cy="20" r="40"/><line x1="78" y1="48" x2="110" y2="80"/></g><rect x="-75" y="-65" width="110" height="140" rx="6" fill="#F4E8C1"/><line x1="-55" y1="-35" x2="15" y2="-35" stroke="#6B4D2E" stroke-width="3"/><line x1="-55" y1="-10" x2="15" y2="-10" stroke="#6B4D2E" stroke-width="3"/><circle cx="50" cy="20" r="34" fill="none" stroke="#C9A26A" stroke-width="8"/><line x1="74" y1="44" x2="104" y2="74" stroke="#C9A26A" stroke-width="10" stroke-linecap="round"/></g>`,
        // Cofre de segredos
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-80" y="-70" width="160" height="140" rx="12"/></g><rect x="-75" y="-65" width="150" height="130" rx="10" fill="#3D3D3D"/><circle cx="0" cy="0" r="30" fill="#2C2C2C" stroke="#C9A26A" stroke-width="4"/><circle cx="0" cy="0" r="8" fill="#C9A26A"/><rect x="25" y="-5" width="30" height="10" rx="3" fill="#C9A26A"/><text x="0" y="50" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="12">SEGREDO</text></g>`,
        // Mapa antigo
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-70" width="180" height="140" rx="8"/></g><rect x="-85" y="-65" width="170" height="130" rx="6" fill="#E8D9B5"/><path d="M -60 -40 Q -20 0 20 -30 Q 60 -60 60 0 Q 60 40 20 30 Q -20 50 -60 20 Z" fill="none" stroke="#1D5D55" stroke-width="3"/><circle cx="-40" cy="-20" r="6" fill="#8C1220"/><circle cx="40" cy="10" r="6" fill="#8C1220"/><path d="M -40 -20 L -10 0 L 40 10" stroke="#8C1220" stroke-width="2" stroke-dasharray="6 4" fill="none"/><text x="30" y="55" fill="#6B4D2E" font-family="serif" font-style="italic" font-size="12">×</text></g>`,
        // Ampulheta com areia
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-55" y="-95" width="110" height="15" rx="4"/><rect x="-55" y="80" width="110" height="15" rx="4"/><path d="M -45 -80 L -10 0 L -45 80 M 45 -80 L 10 0 L 45 80"/></g><rect x="-50" y="-90" width="100" height="10" rx="3" fill="#C9A26A"/><rect x="-50" y="82" width="100" height="10" rx="3" fill="#C9A26A"/><path d="M -40 -80 L -8 -5 L 8 -5 L 40 -80 Z" fill="#1D5D55"/><path d="M -40 80 L -8 5 L 8 5 L 40 80 Z" fill="#0E3631"/><path d="M -25 80 L -4 30 L 4 30 L 25 80 Z" fill="#C9A26A" opacity="0.6"/></g>`,
        // Bússola
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="0" r="80"/></g><circle cx="0" cy="0" r="73" fill="#0E3631"/><circle cx="0" cy="0" r="65" fill="none" stroke="#C9A26A" stroke-width="2"/><polygon points="0,-55 -10,0 0,55 10,0" fill="#8C1220"/><polygon points="0,-55 10,0 0,0 -10,0" fill="#C9A26A"/><circle cx="0" cy="0" r="6" fill="#FFF"/><text x="0" y="-58" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="14">N</text></g>`,
      ];
      centerPropSvg = curVariants[variant];
    } else if (cat.includes('atualidades')) {
      const atualVariants = [
        // Monitor com código
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-70" width="180" height="120" rx="10"/><rect x="-30" y="50" width="60" height="10" rx="3"/><rect x="-50" y="60" width="100" height="10" rx="3"/></g><rect x="-85" y="-65" width="170" height="110" rx="8" fill="#0F172A"/><text x="-60" y="-30" fill="#00D4FF" font-family="monospace" font-size="14">&lt;lei&gt;</text><text x="-45" y="-10" fill="#2ECC71" font-family="monospace" font-size="12">art.5°</text><text x="-60" y="10" fill="#00D4FF" font-family="monospace" font-size="14">&lt;/lei&gt;</text></g>`,
        // Globo com rede
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="0" r="75"/></g><circle cx="0" cy="0" r="68" fill="#1E3A8A"/><ellipse cx="0" cy="0" rx="30" ry="68" fill="none" stroke="#00D4FF" stroke-width="2"/><ellipse cx="0" cy="0" rx="55" ry="68" fill="none" stroke="#00D4FF" stroke-width="2"/><line x1="-68" y1="0" x2="68" y2="0" stroke="#00D4FF" stroke-width="2"/><line x1="-60" y1="-30" x2="60" y2="-30" stroke="#00D4FF" stroke-width="2"/><line x1="-60" y1="30" x2="60" y2="30" stroke="#00D4FF" stroke-width="2"/></g>`,
        // Engrenagem digital
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><circle cx="0" cy="0" r="60"/><rect x="-10" y="-80" width="20" height="25" rx="4"/><rect x="-10" y="55" width="20" height="25" rx="4"/><rect x="-80" y="-10" width="25" height="20" rx="4"/><rect x="55" y="-10" width="25" height="20" rx="4"/></g><circle cx="0" cy="0" r="53" fill="#1E3A8A"/><circle cx="0" cy="0" r="25" fill="#0F172A"/><circle cx="0" cy="0" r="15" fill="#C9A26A"/><text x="0" y="6" text-anchor="middle" fill="#0F172A" font-family="sans-serif" font-weight="bold" font-size="14">⚙</text></g>`,
        // Escudo digital
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><path d="M 0 -90 L -75 -45 L -75 25 Q -75 90 0 100 Q 75 90 75 25 L 75 -45 Z"/></g><path d="M 0 -82 L -68 -40 L -68 22 Q -68 82 0 92 Q 68 82 68 22 L 68 -40 Z" fill="#1E3A8A"/><path d="M -20 -10 L -5 10 L 30 -30" stroke="#00D4FF" stroke-width="8" stroke-linecap="round" fill="none"/><text x="0" y="60" text-anchor="middle" fill="#C9A26A" font-family="sans-serif" font-weight="bold" font-size="12">SEGURO</text></g>`,
        // Balança digital
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><line x1="0" y1="-80" x2="0" y2="60"/><line x1="-70" y1="-40" x2="70" y2="-40"/><rect x="-80" y="-40" width="30" height="50" rx="4"/><rect x="50" y="-40" width="30" height="50" rx="4"/></g><line x1="0" y1="-74" x2="0" y2="54" stroke="#C9A26A" stroke-width="8"/><line x1="-65" y1="-38" x2="65" y2="-38" stroke="#C9A26A" stroke-width="5"/><rect x="-76" y="-36" width="24" height="42" rx="3" fill="#1E3A8A"/><text x="-64" y="-10" text-anchor="middle" fill="#FFF" font-family="monospace" font-size="10">01</text><rect x="54" y="-36" width="24" height="42" rx="3" fill="#8C1220"/><text x="66" y="-10" text-anchor="middle" fill="#FFF" font-family="sans-serif" font-size="10">⚖</text></g>`,
      ];
      centerPropSvg = atualVariants[variant];
    } else {
      // Leis fallback variants
      const leisVariants = [
        // Livro de Lei com selo
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-70" y="-80" width="140" height="170" rx="10"/></g><rect x="-65" y="-75" width="130" height="160" rx="8" fill="#2D4A3E"/><rect x="-50" y="-55" width="100" height="25" rx="4" fill="#C9A26A"/><text x="0" y="-38" text-anchor="middle" fill="#1B3028" font-family="serif" font-weight="bold" font-size="14">LEI</text><line x1="-45" y1="-15" x2="45" y2="-15" stroke="#F4E8C1" stroke-width="2"/><line x1="-45" y1="5" x2="45" y2="5" stroke="#F4E8C1" stroke-width="2"/><line x1="-45" y1="25" x2="30" y2="25" stroke="#F4E8C1" stroke-width="2"/><circle cx="0" cy="60" r="16" fill="#8C1220"/></g>`,
        // Martelo e base
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-20" y="-90" width="40" height="130" rx="6"/><rect x="-60" y="-90" width="120" height="30" rx="8"/><ellipse cx="0" cy="60" rx="70" ry="20"/></g><rect x="-16" y="-85" width="32" height="120" rx="4" fill="#8C6B3D"/><rect x="-55" y="-85" width="110" height="24" rx="6" fill="#6B4D2E"/><ellipse cx="0" cy="58" rx="64" ry="16" fill="#2D4A3E"/></g>`,
        // Código com parágrafos
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-80" y="-80" width="160" height="170" rx="8"/></g><rect x="-75" y="-75" width="150" height="160" rx="6" fill="#F4E8C1" stroke="#C9A26A" stroke-width="3"/><text x="-55" y="-40" fill="#2D4A3E" font-family="serif" font-weight="bold" font-size="14">Art. 1º</text><line x1="-55" y1="-25" x2="55" y2="-25" stroke="#2C2C2C" stroke-width="2"/><text x="-55" y="-5" fill="#8C1220" font-family="serif" font-size="12">§ 1º ___</text><text x="-55" y="20" fill="#1D3A5D" font-family="serif" font-size="12">I - ___</text><text x="-55" y="45" fill="#2D4A3E" font-family="serif" font-size="12">II - ___</text></g>`,
        // Balança da justiça clássica
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><line x1="0" y1="-90" x2="0" y2="70"/><line x1="-80" y1="-50" x2="80" y2="-50"/><path d="M -90 -50 L -70 30 L -110 30 Z"/><path d="M 90 -50 L 70 30 L 110 30 Z"/><ellipse cx="0" cy="80" rx="40" ry="12"/></g><line x1="0" y1="-82" x2="0" y2="62" stroke="#C9A26A" stroke-width="8"/><line x1="-75" y1="-48" x2="75" y2="-48" stroke="#C9A26A" stroke-width="5"/><path d="M -85 -48 L -66 25 L -104 25 Z" fill="#C9A26A"/><path d="M 85 -48 L 66 25 L 104 25 Z" fill="#C9A26A"/><ellipse cx="0" cy="76" rx="34" ry="9" fill="#6B4D2E"/></g>`,
        // Constituição aberta
        `<g filter="url(#shadow)"><g stroke="#FFF" stroke-width="14" fill="#FFF" stroke-linejoin="round"><rect x="-90" y="-60" width="85" height="130" rx="6"/><rect x="5" y="-60" width="85" height="130" rx="6"/></g><rect x="-85" y="-55" width="75" height="120" rx="4" fill="#8C1220"/><rect x="10" y="-55" width="75" height="120" rx="4" fill="#8C1220"/><text x="-48" y="-15" text-anchor="middle" fill="#C9A26A" font-family="serif" font-weight="bold" font-size="16">CF</text><text x="-48" y="10" text-anchor="middle" fill="#F4E8C1" font-family="serif" font-size="12">1988</text><line x1="25" y1="-30" x2="70" y2="-30" stroke="#C9A26A" stroke-width="3"/><line x1="25" y1="-10" x2="70" y2="-10" stroke="#C9A26A" stroke-width="3"/><line x1="25" y1="10" x2="60" y2="10" stroke="#C9A26A" stroke-width="3"/></g>`,
      ];
      centerPropSvg = leisVariants[variant];
    }
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
    <g opacity="0.1" stroke="#FFFFFF" stroke-width="2" fill="none">
      <circle cx="200" cy="150" r="90" />
      <circle cx="1000" cy="500" r="130" />
      <path d="M 150 150 L 250 150 M 200 100 L 200 200" />
      <path d="M 950 500 L 1050 500 M 1000 450 L 1000 550" />
      <line x1="100" y1="610" x2="1100" y2="610" stroke-width="4" stroke-dasharray="16 16" />
    </g>
    <g transform="translate(600, 335) scale(2.2)">
      ${centerPropSvg}
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function resolveCover(p: RawPost): string {
  const t = (p.titulo || '').toLowerCase();
  // 1º) Capa gerada pela IA e salva no Storage (blog-capas) — é a capa oficial
  // do post. Só ignoramos placeholders genéricos do Unsplash.
  if (p.imagem_url && (p.imagem_url.startsWith('http') || p.imagem_url.startsWith('/assets/')) && !p.imagem_url.includes('unsplash.com')) {
    return p.imagem_url;
  }

  // 2º) Assets locais bundled (carregam instantaneamente sem rede)
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
  if (t.includes('cliente difícil') || t.includes('cliente dificil')) return clienteDificilImg;
  if (t.includes('reforma tributária') || t.includes('reforma tributaria')) return reformaTributariaImg;

  // 3º) Último fallback: SVG vetorial para posts sem nenhuma capa
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
