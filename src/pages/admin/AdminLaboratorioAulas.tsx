import React, { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FlaskConical, 
  ArrowLeft, 
  Play, 
  Layers, 
  Sparkles, 
  GitBranch, 
  TableProperties, 
  Columns3, 
  Scale, 
  Lightbulb, 
  CheckCircle2, 
  Eye
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { AULAS_LABORATORIO_CATALOGO } from '@/data/aulasLaboratorioData';

// Code Splitting do Player Nativo
const PlayerAulaNativo = lazy(() => 
  import('@/components/aulas-interativas/PlayerAulaNativo').then(m => ({ default: m.PlayerAulaNativo }))
);

export default function AdminLaboratorioAulas() {
  const navigate = useNavigate();
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);
  const [etapaInicial, setEtapaInicial] = useState<number | undefined>(undefined);

  const abrirAula = (aula: AulaItem, etapa?: number) => {
    try { haptic.selection(); } catch {}
    setEtapaInicial(etapa);
    setAulaAtiva(aula);
  };

  // Se o usuário selecionou uma aula para testar no laboratório, exibe o Player
  if (aulaAtiva) {
    return (
      <div className="relative w-full h-full min-h-screen bg-[#0D0D0D]">
        {/* Badge Flutuante no Topo indicando Ambiente de Laboratório */}
        <div className="fixed top-2.5 right-14 sm:right-20 z-50 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 backdrop-blur-md shadow-lg shadow-black/60">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-300 tracking-wide">LABORATÓRIO ATIVO</span>
          </div>
        </div>

        <Suspense fallback={
          <div className="fixed inset-0 bg-[#0D0D0D] flex flex-col items-center justify-center gap-3 text-white">
            <FlaskConical className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-sm font-serif">Carregando aula do laboratório...</span>
          </div>
        }>
          <PlayerAulaNativo
            aula={aulaAtiva}
            disciplinaNome="Direito Penal"
            corDestaque="#e23e57"
            etapaInicial={etapaInicial}
            onVoltar={() => {
              setAulaAtiva(null);
              setEtapaInicial(undefined);
            }}
            onConcluir={() => {
              setAulaAtiva(null);
              setEtapaInicial(undefined);
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-[calc(6rem+env(safe-area-inset-bottom,24px))] relative overflow-x-hidden">
      {/* HEADER NATIVO COM BOTÃO PADRÃO PREMIUM */}
      <PageHeader 
        title="LABORATÓRIO" 
        subtitle="Ambiente de Testes Visuais & Diagramação"
        onBack={() => navigate('/admin-funcoes')}
        variant="dark"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
        
        {/* BANNER PRINCIPAL DO LABORATÓRIO */}
        <div className="relative overflow-hidden rounded-[26px] sm:rounded-[30px] bg-gradient-to-br from-emerald-950/40 via-zinc-950/90 to-black/95 border border-emerald-500/30 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wider">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                <span>AMBIENTE ISOLADO DE INOVAÇÃO VISUAL</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                Laboratório de Aulas Interativas
              </h2>
              <p className="text-sm text-zinc-300 max-w-xl leading-relaxed">
                Aqui testamos protótipos de layout de alta retenção (fluxogramas com setas, tabelas comparativas, grids de pilares e cards jurisprudenciais) <b>sem alterar nada na plataforma principal</b>.
              </p>
            </div>
            
            <div className="hidden sm:flex shrink-0 w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 items-center justify-center shadow-inner">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* LISTA DE AULAS TESTE NO LABORATÓRIO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Aulas em Teste no Laboratório</span>
            </h3>
            <span className="text-xs text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full font-medium">
              1 protótipo ativo
            </span>
          </div>

          {AULAS_LABORATORIO_CATALOGO.map((aula) => (
            <div 
              key={aula.id}
              className="group relative overflow-hidden rounded-[24px] bg-zinc-950/80 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-5"
            >
              {/* TOPO DO CARD: Capa + Identificação */}
              <div className="flex items-start gap-4">
                <div className="relative w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-xl overflow-hidden border border-white/15 shadow-md">
                  <img 
                    src={aula.capaUrl} 
                    alt={aula.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1.5 inset-x-0 text-center text-[9px] font-bold tracking-wider text-emerald-300 uppercase">
                    TESTE A/B
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/70 border border-rose-500/30 text-rose-300">
                      DIREITO PENAL
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">
                      SLIDE 10 DIAGRAMADO
                    </span>
                    <span className="text-xs text-zinc-400">32 Etapas · Áudio Real</span>
                  </div>

                  <h4 className="text-lg sm:text-xl font-serif font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {aula.titulo}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed">
                    {aula.descricao}
                  </p>
                </div>
              </div>

              {/* RECURSOS VISUAIS INJETADOS NESTE PROTÓTIPO */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                <span className="text-[11px] font-bold tracking-wider text-amber-300 flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Inovações Visuais Aplicadas na Etapa 10
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><b>Árvore de Decisão:</b> Dolo vs Erro de Tipo com setas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TableProperties className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><b>Tabela Sinóptica:</b> Art. 235 (Penas e Sujeitos)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Columns3 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span><b>O Tripé da Bigamia:</b> Grid com 3 pilares dourados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-rose-400 shrink-0" />
                    <span><b>Card Jurisprudencial:</b> Julgado de Família (2023)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span><b>Card Insight:</b> Metáfora da assinatura com destaque</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><b>Áudio Real:</b> 100% gravado no Cloudflare R2</span>
                  </div>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO: IR DIRETO NA ETAPA 10 OU INICIAR DO COMEÇO */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => abrirAula(aula, 9)} // 0-indexed: 9 = Etapa 10
                  className="flex-1 min-h-[48px] py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Direto a Etapa 10 (Novo Layout)</span>
                </button>

                <button
                  type="button"
                  onClick={() => abrirAula(aula, 0)}
                  className="min-h-[48px] py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <Play className="w-4 h-4 text-zinc-300" />
                  <span>Começar da Etapa 1</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CARD INFORMATIVO DE A/B TESTING */}
        <div className="rounded-2xl bg-zinc-950/60 border border-white/5 p-4 text-xs text-zinc-400 space-y-1">
          <p className="font-bold text-zinc-300">🔒 Segurança de Produção:</p>
          <p>
            Esta aula utiliza o identificador isolado <code>lab-penal-01-01</code>. O catálogo e as aulas em produção (como <code>penal-01-01</code>) permanecem 100% inalteradas para os alunos até que você aprove o novo padrão.
          </p>
        </div>

      </div>
    </div>
  );
}
