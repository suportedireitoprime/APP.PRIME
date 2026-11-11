import React from 'react';
import { ArrowLeft, Home, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { MateriaItem, AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { assetUrl } from '@/lib/assetUrl';
import { FallingLotusPetals } from '@/components/flashcards/FallingLotusPetals';
import { FlashcardDeckItem } from '@/components/flashcards/FlashcardDeckItem';
import greciaFilosofosFundo from '@/assets/grecia-filosofos-fundo.webp';

interface AulasTrilhaMateriaViewProps {
  disciplinaAtual: DisciplinaItem;
  materiasDaDisc: MateriaItem[];
  aulasCatalogo: AulaItem[];
  buscaTermo: string;
  setBuscaTermo: (val: string) => void;
  handleVoltar: () => void;
  onSelecionarMateria: (materiaId: string) => void;
  calcularProgressoCiclo: (aula: AulaItem) => {
    etapaAtual: number;
    totalEtapas: number;
    aulaTerminada: boolean;
    fcOk: boolean;
    questoesOk: boolean;
    fasesConcluidasCount: number;
    porcentagemTotal: number;
    cicloCompleto: boolean;
  };
}

function formatarTituloMateriaCurto(titulo: string): string {
  if (!titulo) return '';
  return titulo
    .replace(/^DIREITO\s+/i, '')
    .replace(/^DA\s+/i, '')
    .replace(/^DO\s+/i, '')
    .replace(/^DE\s+/i, '')
    .trim();
}

export const AulasTrilhaMateriaView: React.FC<AulasTrilhaMateriaViewProps> = ({
  disciplinaAtual,
  materiasDaDisc,
  aulasCatalogo,
  buscaTermo,
  setBuscaTermo,
  handleVoltar,
  onSelecionarMateria,
  calcularProgressoCiclo,
}) => {
  const navigate = useNavigate();

  const aulasDaDisc = aulasCatalogo.filter(a => a.disciplinaId === disciplinaAtual.id);
  const totalAulasDisc = aulasDaDisc.length;
  const somaPct = aulasDaDisc.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
  const pctDisc = totalAulasDisc > 0 ? Math.round(somaPct / totalAulasDisc) : 0;

  const termoBuscaNorm = buscaTermo.toLowerCase().trim();
  const materiasFiltradas = materiasDaDisc.filter(mat => {
    if (!termoBuscaNorm) return true;
    const matchNome = (mat.titulo || '').toLowerCase().includes(termoBuscaNorm);
    const matchAula = aulasCatalogo.some(a => a.materiaId === mat.id && a.titulo.toLowerCase().includes(termoBuscaNorm));
    return matchNome || matchAula;
  });

  const theme = getDisciplinaVisualTheme(disciplinaAtual.id);
  const AreaIconComponent = areaIconFor(disciplinaAtual.id).Icon;
  const fundoAreaOficial = theme.isCustomFundo 
    ? theme.fundoAssetUrl 
    : (assetUrl(disciplinaAtual.capaHeroUrl) || greciaFilosofosFundo);

  return (
    <>
      {/* Fundo Oficial Fixo da Área */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#0a0705]">
        <img
          src={fundoAreaOficial}
          alt={disciplinaAtual.nome}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top select-none pointer-events-none filter blur-[0.5px] brightness-[0.98] contrast-[1.02] transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </div>

      {/* Pétalas e Flores de Lótus Douradas Caindo Suavemente pela Montanha (120fps GPU) */}
      <FallingLotusPetals />

      {/* Top Bar Fixa de Navegação da Disciplina */}
      <div 
        className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#0D0D0D]/90 border-b border-white/10 px-3.5 sm:px-6 py-2.5 transition-all shadow-xl"
        style={{
          paddingTop: 'calc(0.75rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleVoltar}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-white active:scale-95 transition shadow-lg shrink-0 cursor-pointer"
            aria-label="Voltar para áreas"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          {/* Título Centralizado com Barra de Progresso */}
          <div className="flex-1 min-w-0 max-w-md mx-auto flex flex-col items-center justify-center text-center px-2">
            <div className="flex items-center gap-1.5 max-w-full truncate">
              <span 
                className="w-1.5 h-1.5 rounded-full shrink-0" 
                style={{ backgroundColor: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }}
              />
              <span 
                className="text-xs sm:text-sm font-serif font-black uppercase tracking-wider truncate text-white"
                style={{ color: theme.highlight }}
              >
                {disciplinaAtual.nome}
              </span>
            </div>
            <div className="w-full max-w-[200px] sm:max-w-[240px] flex items-center gap-2 mt-1">
              <div 
                className="flex-1 h-1.5 rounded-full bg-black/60 overflow-hidden"
                style={{ border: `1px solid ${theme.borderSubtle}` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(pctDisc, totalAulasDisc > 0 ? 4 : 0)}%`,
                    background: theme.progressGradient,
                    boxShadow: theme.progressShadow,
                  }}
                />
              </div>
              <span 
                className="text-[10px] sm:text-[10.5px] font-mono font-bold tabular-nums shrink-0"
                style={{ color: theme.accent }}
              >
                {pctDisc}%
              </span>
            </div>
          </div>

          {/* Botão de Atalho para o Início do Aplicativo (Home) */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-white active:scale-95 transition shadow-lg shrink-0 cursor-pointer"
            aria-label="Voltar para o Início do aplicativo"
            title="Início do aplicativo"
          >
            <Home className="w-5.5 h-5.5 sm:w-6 sm:h-6" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Conteúdo da Trilha Serpenteante */}
      <div className="relative z-10 w-full max-w-[700px] mx-auto px-3.5 sm:px-6 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] pt-2 min-w-0 overflow-x-hidden box-border">
        {/* Barra de Pesquisa Rápida das Matérias */}
        <div className="w-full max-w-[360px] xs:max-w-[460px] sm:max-w-xl mx-auto px-2 my-2.5 z-20">
          <div className="relative w-full">
            <div 
              className="absolute left-3.5 xs:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 transition-colors"
              style={{ color: theme.accent }}
            >
              <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <input
              type="text"
              value={buscaTermo}
              onChange={(e) => setBuscaTermo(e.target.value)}
              placeholder={`Buscar matéria em ${disciplinaAtual.nome}...`}
              className="w-full h-12 xs:h-12.5 sm:h-13.5 pl-11 xs:pl-12 pr-11 xs:pr-12 rounded-full text-xs xs:text-sm sm:text-base text-white placeholder:text-zinc-400/75 focus:outline-none transition-all shadow-inner"
              style={{
                background: 'rgba(15, 6, 10, 0.85)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${buscaTermo ? theme.accent : theme.borderSubtle}`,
                boxShadow: buscaTermo 
                  ? `0 0 16px ${theme.glowSoft}, inset 0 2px 4px rgba(0,0,0,0.7)` 
                  : 'inset 0 2px 4px rgba(0,0,0,0.6)',
              }}
            />
            {buscaTermo && (
              <button
                type="button"
                onClick={() => setBuscaTermo('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white cursor-pointer z-10 transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Trilha Serpenteante Oficial de Matérias */}
        <div className="relative py-2 sm:py-4 w-full min-w-0 max-w-full overflow-hidden">
          <div className="w-full min-w-0 relative z-[2] flex flex-col items-center">
            {/* ── CUME DA TRILHA: O TEMPLO DA ACRÓPOLE ── */}
            <div className="w-full flex flex-col items-center justify-center pt-2 pb-4">
              <div className="relative flex flex-col items-center">
                {/* Halo solar suave atrás do Parthenon */}
                <div 
                  className="absolute -top-4 w-40 h-28 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at center, ${theme.glow} 0%, ${theme.glowSoft} 60%, transparent 100%)`,
                    filter: 'blur(16px)',
                  }}
                />

                {/* Ícone Monumental Oficial da Disciplina */}
                <div 
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex items-center justify-center shadow-2xl mb-2"
                  style={{
                    background: theme.bgCard,
                    borderColor: theme.border,
                    boxShadow: `0 0 24px ${theme.glowSoft}, inset 0 2px 4px rgba(255, 255, 255, 0.15)`,
                  }}
                >
                  <AreaIconComponent 
                    className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-md" 
                    style={{ color: theme.accent, filter: `drop-shadow(0 2px 8px ${theme.glow})` }}
                  />
                </div>

                {/* Placa com o Nome da Disciplina */}
                <div 
                  className="px-4 py-1.5 rounded-full border flex items-center gap-2 backdrop-blur-md"
                  style={{
                    background: theme.bgCard,
                    borderColor: theme.border,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.1)',
                  }}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }}
                  />
                  <span 
                    className="text-[11px] sm:text-xs font-serif font-black tracking-widest uppercase"
                    style={{ color: theme.highlight }}
                  >
                    {disciplinaAtual.nome}
                  </span>
                </div>

                {/* Descrição: Matérias → Aulas → Progresso */}
                <div 
                  className="flex items-center gap-1.5 text-[10.5px] sm:text-[11.5px] font-serif font-semibold mt-2 px-3 py-1 rounded-full border backdrop-blur-md"
                  style={{
                    background: theme.bgCard,
                    borderColor: theme.borderSubtle,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.08)',
                    color: theme.highlight,
                  }}
                >
                  <span>{materiasDaDisc.length} matérias</span>
                  <span className="font-bold" style={{ color: theme.accent }}>→</span>
                  <span>{totalAulasDisc} aulas</span>
                  <span className="font-bold" style={{ color: theme.accent }}>→</span>
                  <span className="font-mono font-bold" style={{ color: theme.accent }}>{pctDisc}% concluído</span>
                </div>

                {/* Início da Estrada saindo do templo */}
                <div 
                  className="w-1.5 h-6 my-2 rounded-full"
                  style={{
                    background: theme.roadGradient,
                    boxShadow: theme.roadShadow,
                  }}
                />
              </div>
            </div>

            {/* Nós Serpenteantes: Cada Nó é uma Matéria Oficial com FlashcardDeckItem */}
            {materiasFiltradas.map((mat, matIdx) => {
              const isLast = matIdx === materiasFiltradas.length - 1;
              const aulasDaMat = aulasCatalogo.filter(a => a.materiaId === mat.id);
              const totalAulasMat = aulasDaMat.length;
              const somaPctMat = aulasDaMat.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
              const pctMat = totalAulasMat > 0 ? Math.round(somaPctMat / totalAulasMat) : 0;
              const concluidasMat = aulasDaMat.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;
              const isActive = matIdx === 0;
              const isLocked = false;
              const tituloCurto = formatarTituloMateriaCurto(mat.titulo);

              const itemData = {
                key: mat.id,
                titulo: tituloCurto,
                badgeLabel: `Matéria ${String(matIdx + 1).padStart(2, '0')}`,
                ordemStr: String(matIdx + 1).padStart(2, '0'),
                displayTotal: totalAulasMat,
                temasCount: totalAulasMat,
                displayConcluidas: concluidasMat,
                displayPct: pctMat,
                subtituloCustom: `${totalAulasMat} ${totalAulasMat === 1 ? 'aula' : 'aulas'}${pctMat > 0 ? ` • ${pctMat}% concluído` : ''}`,
                isLocked,
                onClick: () => {
                  try { haptic.selection(); } catch {}
                  onSelecionarMateria(mat.id);
                },
              };

              return (
                <div
                  key={mat.id}
                  id={`materia-section-${mat.id}`}
                  className="w-full flex flex-col items-center"
                >
                  <FlashcardDeckItem
                    item={itemData}
                    i={matIdx}
                    isLast={isLast}
                    isActive={isActive}
                    theme={theme}
                  />
                </div>
              );
            })}

            {materiasFiltradas.length === 0 && (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                <Search className="w-9 h-9 text-zinc-500 stroke-[1.5]" />
                <p className="text-zinc-300 text-sm">
                  Nenhuma matéria encontrada para "<span className="text-white font-semibold">{buscaTermo}</span>"
                </p>
                <button
                  type="button"
                  onClick={() => setBuscaTermo('')}
                  className="text-xs font-semibold underline cursor-pointer"
                  style={{ color: theme.accent }}
                >
                  Limpar pesquisa
                </button>
              </div>
            )}

            {/* Louros da Vitória Clássicos no Rodapé da Trilha */}
            <div className="w-full flex items-center justify-between px-6 pt-8 pb-4" style={{ color: theme.borderSubtle }}>
              <svg className="w-9 h-9 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9" />
                <path d="M7 6c1 1 2 2 2 4s-1 3-2 4" />
                <path d="M4 11c1 1 2 2 2 4s-1 3-2 4" />
              </svg>
              <span 
                className="text-[10px] font-serif font-semibold tracking-widest uppercase text-center"
                style={{ color: theme.accent, opacity: 0.85 }}
              >
                Trilha do Saber • {disciplinaAtual.nome}
              </span>
              <svg className="w-9 h-9 rotate-12 scale-x-[-1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9" />
                <path d="M7 6c1 1 2 2 2 4s-1 3-2 4" />
                <path d="M4 11c1 1 2 2 2 4s-1 3-2 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

