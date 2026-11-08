// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import {
  RotateCcw, BarChart3, ChevronRight, NotebookPen,
  Filter, History, Timer, Scale, X, ExternalLink,
  PlayCircle, Shield, BookOpen, ShieldAlert, Gavel
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import SimuladosHero from '@/components/simulados/SimuladosHero';
import SimuladosFiltroSheet, { SimuladoFiltroConfig } from '@/components/simulados/SimuladosFiltroSheet';
import SimuladosProvasSheet from '@/components/simulados/SimuladosProvasSheet';
import SimuladosHistoricoSheet from '@/components/simulados/SimuladosHistoricoSheet';

const ATALHOS_4 = [
  { id: 'historico', label: 'Histórico', desc: 'Sessões salvas', icon: History },
  { id: 'provas', label: 'Provas Oficiais', desc: 'Cadernos digitalizados', icon: NotebookPen },
  { id: 'revisao', label: 'Revisão', desc: 'Volte no que errou', icon: RotateCcw },
  { id: 'desempenho', label: 'Desempenho', desc: 'Aproveitamento geral', icon: BarChart3 },
];

export default function Simulados() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Estados de Modais e Sheets
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [provasSheetAberto, setProvasSheetAberto] = useState(false);
  const [filtroCargoProvasSheet, setFiltroCargoProvasSheet] = useState<string | undefined>(undefined);
  const [historicoSheetTipo, setHistoricoSheetTipo] = useState<'historico' | 'desempenho' | 'revisao' | null>(null);

  // Estados de PDF e Raio-X
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');
  const [selectedSimuladoRaioX, setSelectedSimuladoRaioX] = useState<any | null>(null);

  // 1. Busca todos os simulados cadastrados
  const { data: simuladosList = [] } = useQuery({
    queryKey: ['simulados_lista_hub'],
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulados')
        .select(`
          id,
          year,
          prova_url,
          gabarito_url,
          edital_url,
          created_at,
          exam:simulado_exams(name)
        `)
        .order('year', { ascending: false });

      if (error) {
        console.warn('Erro ao carregar simulados:', error);
        return [];
      }
      return data || [];
    },
  });

  // Total exato de questões cadastradas no banco de simulados
  const { data: totalQuestoesReal = 22056 } = useQuery({
    queryKey: ['simulados_total_questoes_banco'],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('simulado_questions')
        .select('id', { count: 'exact', head: true });
      if (error || !count) return 22056;
      return count;
    },
  });

  // 2. Estatísticas e Histórico do Usuário
  const { data: userHistorico = [] } = useQuery({
    queryKey: ['user_simulados_historico', user?.id],
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_simulados_historico')
        .select(`
          *,
          simulado:simulados(year, prova_url)
        `)
        .eq('user_id', user!.id)
        .order('started_at', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar historico:', error);
        return [];
      }
      return data || [];
    },
  });

  // Métricas agregadas
  const totalResolvidos = userHistorico.length;
  const totalAcertos = userHistorico.reduce((acc, h) => acc + (h.acertos || 0), 0);
  const totalQuestoesFeitas = userHistorico.reduce((acc, h) => acc + (h.total_questoes || 0), 0);
  const pctAcerto = totalQuestoesFeitas > 0 ? Math.round((totalAcertos / totalQuestoesFeitas) * 100) : 0;
  const totalQuestoesBanco = totalQuestoesReal;

  // Contagens dinâmicas por carreira para os cards de destaque
  const contagensDestaque = useMemo(() => {
    const getStats = (filterFn: (name: string) => boolean, fallbackQ: number, fallbackP: number) => {
      const filtered = simuladosList.filter((s) => filterFn((s.exam?.name || '').toLowerCase()));
      const provas = filtered.length;
      return {
        questoes: fallbackQ,
        provas: provas > 0 ? provas : fallbackP,
      };
    };

    return {
      oab: getStats((n) => n.includes('oab'), 7698, 47),
      prf: getStats((n) => n.includes('prf') || n.includes('rodovi'), 1001, 14),
      delegado: getStats((n) => n.includes('delegado'), 1823, 22),
      escrevente: getStats((n) => n.includes('escrevente') || n.includes('tjsp'), 1552, 22),
      juiz: getStats((n) => n.includes('juiz') || n.includes('magistratura'), 5213, 58),
      promotor: getStats((n) => n.includes('promotor') || n.includes('ministério público') || n.includes('mpe'), 2285, 23),
    };
  }, [simuladosList]);

  // Iniciar Simulado a partir do Filtro Rápido
  const handleIniciarFiltro = (cfg: SimuladoFiltroConfig) => {
    setFiltroAberto(false);
    let targetId = cfg.simuladoId;

    if (!targetId && simuladosList.length > 0) {
      const doCargo = simuladosList.filter((s) => {
        const name = (s.exam?.name || '').toLowerCase();
        const examId = s.exam_id || s.exam?.id;
        const cargoQuery = (cfg.cargoId || '').toLowerCase();
        const cargoNomeQuery = (cfg.cargoNome || '').toLowerCase();
        return (
          examId === cfg.cargoId ||
          name.includes(cargoQuery) ||
          (cargoNomeQuery && name.includes(cargoNomeQuery))
        );
      });
      targetId = doCargo[0]?.id || simuladosList[0]?.id;
    }

    if (!targetId) {
      targetId = simuladosList[0]?.id;
    }

    navigate(`/simulados/resolver/${targetId}`, {
      state: {
        filtroMaterias: cfg.disciplinas.length > 0 ? cfg.disciplinas : undefined,
        modo: cfg.modo,
        quantidade: cfg.quantidade,
      },
    });
  };

  // Iniciar Simulado direto
  const handleIniciarSimulado = (sim: any, filtroMaterias?: string[]) => {
    setProvasSheetAberto(false);
    navigate(`/simulados/resolver/${sim.id}`, {
      state: {
        simulado: sim,
        filtroMaterias: filtroMaterias && filtroMaterias.length > 0 ? filtroMaterias : undefined,
      },
    });
  };

  return (
    <div className="theme-questoes min-h-screen bg-background relative overflow-hidden">
      {/* ── Fundo Animado com Quadradinhos (ShapeGrid Oficial do App) ── */}
      <div className="fixed inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(124, 58, 237, 0.15)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl lg:max-w-7xl 2xl:max-w-[1600px] px-0 lg:px-8 pb-12">
        <div className="space-y-6">
          {/* ── Banner de Desempenho (Hero Roxo Oficial #7c3aed) ───────────────── */}
          <div className="w-full">
            <SimuladosHero
              totalSimuladosDisponiveis={simuladosList.length || 53}
              totalQuestoesBanco={totalQuestoesBanco}
              totalResolvidos={totalResolvidos}
              onBack={() => navigate('/')}
              onOpenHistorico={() => setHistoricoSheetTipo('historico')}
              onOpenDesempenho={() => setHistoricoSheetTipo('desempenho')}
              onOpenProvas={() => setProvasSheetAberto(true)}
            />
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
            }}
            initial="hidden"
            animate="show"
            className="px-3.5 sm:px-6 lg:px-0 space-y-6"
          >
            {/* ── Card Principal com Botão "Filtro Rápido" (Roxo Oficial) ───────────────── */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
              className="bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl"
            >
              <div className="flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-[#7c3aed]" />
                <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl">
                  Praticar Simulados
                </h2>
              </div>
              <p className="ml-3 mt-1 text-xs text-muted-foreground">
                Escolha filtros personalizados e comece sua rotina de resolução.
              </p>

              <motion.button
                key={location.key}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setFiltroAberto(true);
                }}
                className="btn-attention-shine group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-base sm:text-lg font-black shadow-xl shadow-[#7c3aed]/25 transition-all focus-visible:outline-none border border-violet-400/30 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)] cursor-pointer"
              >
                <Filter className="h-6 w-6 text-white drop-shadow-md" strokeWidth={2.5} />
                <span className="tracking-wide text-white">Filtro Rápido</span>
                <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1 drop-shadow-md" strokeWidth={2.5} />
              </motion.button>
            </motion.div>

            {/* ── 4 Cards (Histórico, Provas Oficiais, Revisão, Desempenho) ── */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
            >
              <div className="grid grid-cols-4 max-w-2xl mx-auto gap-2 lg:gap-4">
                {ATALHOS_4.map((a) => {
                  const Icon = a.icon;
                  return (
                    <motion.button
                      key={a.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        if (a.id === 'provas') {
                          setProvasSheetAberto(true);
                        } else {
                          setHistoricoSheetTipo(a.id as any);
                        }
                      }}
                      className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#7c3aed]/50 transition-colors gap-2 text-center focus-visible:outline-none cursor-pointer"
                    >
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-400 transition-all duration-300 group-hover:text-purple-300 group-hover:scale-110" strokeWidth={2} />
                        <Icon className="absolute inset-auto w-7 h-7 sm:w-8 sm:h-8 text-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 icon-shine-mask" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-foreground leading-tight">{a.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{a.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* ── Recursos (OAB e Magistratura em Destaque) ───────────────────── */}
            <motion.section
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
              className="space-y-3 pt-2"
            >
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-[#7c3aed]" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Simulados Oficiais em Destaque
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Card OAB */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setFiltroCargoProvasSheet('oab');
                    setProvasSheetAberto(true);
                  }}
                  className="group flex flex-col items-center justify-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#7c3aed]/50 transition-all focus-visible:outline-none text-center cursor-pointer"
                >
                  <div className="flex items-center justify-center text-[#7c3aed] group-hover:scale-110 transition-transform">
                    <Timer className="h-7 w-7 sm:h-8 sm:w-8 text-[#7c3aed]" strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-bold text-foreground">OAB Nacional</span>
                    <span className="text-xs font-black text-purple-400 mt-1">
                      {contagensDestaque.oab.questoes.toLocaleString('pt-BR')} questões
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {contagensDestaque.oab.provas} Edições • 1ª Fase Oficial
                    </span>
                  </div>
                </motion.button>

                {/* Card PRF */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setFiltroCargoProvasSheet('prf');
                    setProvasSheetAberto(true);
                  }}
                  className="group flex flex-col items-center justify-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#7c3aed]/50 transition-all focus-visible:outline-none text-center cursor-pointer"
                >
                  <div className="flex items-center justify-center text-[#eab308] group-hover:scale-110 transition-transform">
                    <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-[#eab308]" strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-bold text-foreground">PRF (Polícia Rodoviária)</span>
                    <span className="text-xs font-black text-amber-400 mt-1">
                      {contagensDestaque.prf.questoes.toLocaleString('pt-BR')} questões
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {contagensDestaque.prf.provas} provas • Cebraspe
                    </span>
                  </div>
                </motion.button>

                {/* Card Delegado */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setFiltroCargoProvasSheet('delegado');
                    setProvasSheetAberto(true);
                  }}
                  className="group flex flex-col items-center justify-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#7c3aed]/50 transition-all focus-visible:outline-none text-center cursor-pointer"
                >
                  <div className="flex items-center justify-center text-[#3b82f6] group-hover:scale-110 transition-transform">
                    <ShieldAlert className="h-7 w-7 sm:h-8 sm:w-8 text-[#3b82f6]" strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-bold text-foreground">Delegado de Polícia</span>
                    <span className="text-xs font-black text-blue-400 mt-1">
                      {contagensDestaque.delegado.questoes.toLocaleString('pt-BR')} questões
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {contagensDestaque.delegado.provas} provas • PF & PC
                    </span>
                  </div>
                </motion.button>

                {/* Card Escrevente TJ-SP */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setFiltroCargoProvasSheet('escrevente');
                    setProvasSheetAberto(true);
                  }}
                  className="group flex flex-col items-center justify-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#7c3aed]/50 transition-all focus-visible:outline-none text-center cursor-pointer"
                >
                  <div className="flex items-center justify-center text-[#10b981] group-hover:scale-110 transition-transform">
                    <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-[#10b981]" strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-bold text-foreground">Escrevente TJ-SP</span>
                    <span className="text-xs font-black text-emerald-400 mt-1">
                      {contagensDestaque.escrevente.questoes.toLocaleString('pt-BR')} questões
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {contagensDestaque.escrevente.provas} provas • Vunesp
                    </span>
                  </div>
                </motion.button>

                {/* Card Juiz */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setFiltroCargoProvasSheet('juiz');
                    setProvasSheetAberto(true);
                  }}
                  className="group flex flex-col items-center justify-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#7c3aed]/50 transition-all focus-visible:outline-none text-center cursor-pointer"
                >
                  <div className="flex items-center justify-center text-[#8b5cf6] group-hover:scale-110 transition-transform">
                    <Scale className="h-7 w-7 sm:h-8 sm:w-8 text-[#8b5cf6]" strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-bold text-foreground">Juiz Substituto</span>
                    <span className="text-xs font-black text-violet-400 mt-1">
                      {contagensDestaque.juiz.questoes.toLocaleString('pt-BR')} questões
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {contagensDestaque.juiz.provas} provas • Magistratura
                    </span>
                  </div>
                </motion.button>

                {/* Card Promotor MP */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setFiltroCargoProvasSheet('promotor');
                    setProvasSheetAberto(true);
                  }}
                  className="group flex flex-col items-center justify-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#7c3aed]/50 transition-all focus-visible:outline-none text-center cursor-pointer"
                >
                  <div className="flex items-center justify-center text-[#ef4444] group-hover:scale-110 transition-transform">
                    <Gavel className="h-7 w-7 sm:h-8 sm:w-8 text-[#ef4444]" strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-bold text-foreground">Promotor de Justiça</span>
                    <span className="text-xs font-black text-rose-400 mt-1">
                      {contagensDestaque.promotor.questoes.toLocaleString('pt-BR')} questões
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {contagensDestaque.promotor.provas} provas • Ministério Público
                    </span>
                  </div>
                </motion.button>
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>

      {/* ── BOTTOM SHEET DO FILTRO RÁPIDO (ABRE DE BAIXO PARA CIMA) ── */}
      <SimuladosFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        onIniciar={handleIniciarFiltro}
        simuladosList={simuladosList}
      />

      {/* ── BOTTOM SHEET DE TODAS AS PROVAS OFICIAIS ── */}
      <SimuladosProvasSheet
        aberto={provasSheetAberto}
        onFechar={() => {
          setProvasSheetAberto(false);
          setFiltroCargoProvasSheet(undefined);
        }}
        simuladosList={simuladosList}
        filtroInicialCargo={filtroCargoProvasSheet}
        onIniciar={handleIniciarSimulado}
        onVerGabarito={(url, title) => {
          setPreviewPdfUrl(url);
          setPreviewPdfTitle(title);
        }}
        onVerRaioX={(sim) => setSelectedSimuladoRaioX(sim)}
      />

      {/* ── BOTTOM SHEET DE HISTÓRICO / DESEMPENHO / REVISÃO ── */}
      {historicoSheetTipo && (
        <SimuladosHistoricoSheet
          aberto={true}
          tipo={historicoSheetTipo}
          historicoList={userHistorico}
          onFechar={() => setHistoricoSheetTipo(null)}
          onContinuar={(simuladoId) => {
            setHistoricoSheetTipo(null);
            navigate(`/simulados/resolver/${simuladoId}`);
          }}
        />
      )}

      {/* ── MODAL DE PREVIEW DO GABARITO OFICIAL PDF ── */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl h-[85vh] bg-[#141416] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-zinc-900/90">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[80%]">
                {previewPdfTitle}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition"
                  title="Abrir em Nova Aba"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <iframe
              src={previewPdfUrl}
              className="w-full flex-1 border-0 bg-zinc-950"
              title="Gabarito PDF"
            />
          </div>
        </div>
      )}

      {/* ── SHEET LATERAL DE RAIO-X ── */}
      <Sheet open={!!selectedSimuladoRaioX} onOpenChange={(open) => !open && setSelectedSimuladoRaioX(null)}>
        <SheetContent side="bottom" className="bg-[#141416] border-white/10 text-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
          <SheetHeader className="text-left pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
              <span>{selectedSimuladoRaioX?.year}</span>
              <span>•</span>
              <span>{selectedSimuladoRaioX?.exam?.name || 'Oficial'}</span>
            </div>
            <SheetTitle className="text-lg font-black text-white">
              Raio-X de Matérias do Simulado
            </SheetTitle>
          </SheetHeader>

          <div className="py-4 space-y-3">
            <p className="text-xs text-zinc-400">
              Distribuição oficial de questões por disciplina neste caderno:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                <span className="text-zinc-300">Ética Profissional</span>
                <span className="font-bold text-violet-400">8 Qs</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                <span className="text-zinc-300">Direito Constitucional</span>
                <span className="font-bold text-violet-400">6 Qs</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                <span className="text-zinc-300">Direito Civil</span>
                <span className="font-bold text-violet-400">7 Qs</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                <span className="text-zinc-300">Processo Civil</span>
                <span className="font-bold text-violet-400">7 Qs</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                <span className="text-zinc-300">Direito Penal</span>
                <span className="font-bold text-violet-400">6 Qs</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                <span className="text-zinc-300">Processo Penal</span>
                <span className="font-bold text-violet-400">6 Qs</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                <span className="text-zinc-300">Direito Administrativo</span>
                <span className="font-bold text-violet-400">6 Qs</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                <span className="text-zinc-300">Direito Tributário</span>
                <span className="font-bold text-violet-400">5 Qs</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                <span className="text-zinc-300">Direito do Trabalho</span>
                <span className="font-bold text-violet-400">5 Qs</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                <span className="text-zinc-300">Processo do Trabalho</span>
                <span className="font-bold text-violet-400">5 Qs</span>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  const s = selectedSimuladoRaioX;
                  setSelectedSimuladoRaioX(null);
                  handleIniciarSimulado(s);
                }}
                className="w-full h-12 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#7c3aed]/25"
              >
                <PlayCircle className="w-4 h-4" /> Iniciar este Simulado
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
