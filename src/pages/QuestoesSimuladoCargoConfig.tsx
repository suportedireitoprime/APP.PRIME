import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Timer,
  Gavel,
  ChevronRight,
  Loader2,
  Play,
  Clock,
  Sliders,
  Trophy,
  History,
  AlertCircle,
  FileText,
  BookOpen,
  Check,
  Layers,
  HelpCircle,
  Info
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import { useQuestoesCargos, useQuestoesSessao, useQuestoesAreas, type Cargo } from '@/hooks/useQuestoes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

import prfLogo from '@/assets/cargos/policia-rodoviaria-federal.webp';
import pfLogo from '@/assets/cargos/policia-federal.webp';
import pcDfLogo from '@/assets/cargos/policia-civil-df.webp';
import pmSpLogo from '@/assets/cargos/policia-militar-sp.webp';
import ppRsLogo from '@/assets/cargos/policia-penal-rs.webp';

function getCargoLogo(nome?: string | null) {
  const n = (nome || '').toLowerCase();
  if (n.includes('prf') || n.includes('rodoviár') || n.includes('rodoviario')) return prfLogo;
  if (n.includes('polícia federal') || n.includes('policia federal')) return pfLogo;
  if (n.includes('polícia civil') || n.includes('policia civil')) return pcDfLogo;
  if (n.includes('polícia militar') || n.includes('policia militar')) return pmSpLogo;
  if (n.includes('polícia penal') || n.includes('policia penal')) return ppRsLogo;
  return null;
}

const db = supabase as any;

type SimuladoHistorico = {
  id: string;
  titulo: string;
  total: number;
  acertos: number;
  duracao_seg: number;
  status: string;
  created_at: string;
};

export default function QuestoesSimuladoCargoConfig() {
  const { cargoId } = useParams<{ cargoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cargos } = useQuestoesCargos();

  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'config' | 'raioX' | 'sobre'>('config');
  
  // Qtd opções: 'todas' | 10 | 20 | 30 | 50
  const [tamanhoOpcao, setTamanhoOpcao] = useState<'todas' | number>(20);
  
  // Seleção de Matérias & Assuntos (Obrigatório selecionar matéria)
  const [selMaterias, setSelMaterias] = useState<string[]>([]);
  const [selAssuntos, setSelAssuntos] = useState<string[]>([]);
  const [sheetMaterias, setSheetMaterias] = useState(false);
  const [sheetAssuntos, setSheetAssuntos] = useState(false);

  // Modo do Cronômetro — Padrão: "Sem Pressão" ('livre')
  const [modoTempo, setModoTempo] = useState<'livre' | 'cronometrado'>('livre');
  
  const [rodando, setRodando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [historico, setHistorico] = useState<SimuladoHistorico[]>([]);
  const [resultadoFinal, setResultadoFinal] = useState<{ acertos: number; total: number; tempo: number } | null>(null);

  const simuladoId = useRef<string | null>(null);
  const acertos = useRef(0);

  // Busca disciplinas disponíveis para este cargo
  const { areas: disciplinas, loading: loadingDisciplinas } = useQuestoesAreas(null, cargo?.id ?? null);

  // Encontra o cargo pelo ID ou Slug
  useEffect(() => {
    if (cargoId === 'geral') {
      setCargo({
        id: 'geral',
        nome: 'Simulado Geral',
        slug: 'geral',
        cor: '#E6C200',
        icone: 'Timer',
        total_questoes: 25000,
      });
      return;
    }
    if (cargos.length > 0) {
      const achado = cargos.find((c) => c.id === cargoId || c.slug === cargoId);
      if (achado) {
        setCargo(achado);
      } else {
        setCargo({
          id: cargoId || 'geral',
          nome: cargoId ? cargoId.replace(/-/g, ' ').toUpperCase() : 'Simulado',
          slug: cargoId || 'geral',
          cor: '#E6C200',
          icone: 'Gavel',
          total_questoes: 1000,
        });
      }
    }
  }, [cargoId, cargos]);

  // Carrega histórico de simulados deste cargo
  useEffect(() => {
    if (!user || !cargo) return;
    let cancelado = false;
    (async () => {
      const query = db.from('questoes_simulados').select('*').eq('user_id', user.id);
      if (cargo.id !== 'geral') {
        query.eq('cargo_id', cargo.id);
      }
      const { data } = await query.order('created_at', { ascending: false }).limit(5);
      if (!cancelado && data) {
        setHistorico(data as SimuladoHistorico[]);
      }
    })();
    return () => { cancelado = true; };
  }, [user, cargo]);

  // Limpa o nome do cargo (remove números no final como " 1")
  const cleanNome = cargo?.nome ? cargo.nome.replace(/\s+\d+$/, '') : 'Simulado';

  // Define a quantidade real de questões
  const finalLimite = tamanhoOpcao === 'todas' ? (cargo?.total_questoes || 100) : tamanhoOpcao;

  const { questoes, loading, recarregar, registrar } = useQuestoesSessao(
    rodando
      ? {
          cargoId: cargo?.id !== 'geral' ? cargo?.id : null,
          area: selMaterias.length > 0 ? selMaterias[0] : null,
          limite: finalLimite,
        }
      : { limite: 1, cargoId: '00000000-0000-0000-0000-000000000000' }
  );

  // Timer
  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rodando]);

  const iniciar = async () => {
    if (selMaterias.length === 0) {
      toast.error('Selecione ao menos uma matéria para iniciar o simulado!');
      return;
    }
    acertos.current = 0;
    setSegundos(0);
    setResultadoFinal(null);
    setRodando(true);

    if (user) {
      const { data } = await db.from('questoes_simulados').insert({
        user_id: user.id,
        titulo: `Simulado ${cleanNome}`,
        cargo_id: cargo?.id !== 'geral' ? cargo?.id : null,
        cargo: cleanNome,
        total: finalLimite,
      }).select('id').single();

      simuladoId.current = data?.id ?? null;
    }
  };

  const registrarSimulado = async (questaoId: string, alternativa: string, acertou: boolean) => {
    if (acertou) acertos.current += 1;
    await registrar(questaoId, alternativa, acertou, 'simulado');

    if (simuladoId.current) {
      await db.from('questoes_simulado_itens').insert({
        simulado_id: simuladoId.current,
        questao_id: questaoId,
        alternativa,
        acertou,
      });

      await db.from('questoes_simulados').update({
        acertos: acertos.current,
        duracao_seg: segundos,
      }).eq('id', simuladoId.current);
    }
  };

  const finalizar = async () => {
    const totalResp = acertos.current;
    const tempoGasto = segundos;

    if (simuladoId.current) {
      await db.from('questoes_simulados').update({
        status: 'concluido',
        finalizado_em: new Date().toISOString(),
        acertos: totalResp,
        duracao_seg: tempoGasto,
      }).eq('id', simuladoId.current);
    }

    setResultadoFinal({
      acertos: totalResp,
      total: finalLimite,
      tempo: tempoGasto,
    });

    simuladoId.current = null;
    setRodando(false);
  };

  const mmss = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;
  const totalSimuladosFatos = historico.length;
  const mediaAcertos = totalSimuladosFatos > 0
    ? Math.round(historico.reduce((acc, curr) => acc + (curr.total > 0 ? (curr.acertos / curr.total) * 100 : 0), 0) / totalSimuladosFatos)
    : 0;

  const totalDisciplinasQuestoes = disciplinas.reduce((acc, d) => acc + Number(d.total || 0), 0);

  return (
    <div className="theme-questoes min-h-screen bg-background pb-36 pt-[calc(0.5rem+var(--sai-top))]">
      <PageHeader
        title={`Simulado ${cleanNome}`}
        subtitle={rodando ? mmss : 'Personalize sua prova'}
        onBack={() => {
          if (rodando) {
            if (window.confirm('Deseja encerrar o simulado em andamento?')) {
              finalizar();
            }
          } else {
            navigate('/questoes/simulado');
          }
        }}
      />

      <div className="mx-auto w-full max-w-3xl px-3.5 sm:px-6 space-y-5 pt-2">
        {!rodando && !resultadoFinal ? (
          <>
            {/* Hero Card do Cargo em Destaque Dourado/Amarelo */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-xl"
            >
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg p-2 bg-amber-500/10 border border-amber-500/30">
                  {getCargoLogo(cargo?.nome) ? (
                    <img src={getCargoLogo(cargo?.nome)!} alt="" className="w-10 h-10 object-contain drop-shadow-sm" />
                  ) : (
                    <Gavel className="w-7 h-7 text-amber-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase leading-snug">
                    {cleanNome}
                  </h1>
                  <p className="text-xs font-semibold text-amber-400/90 mt-0.5">
                    {cargo?.total_questoes ? cargo.total_questoes.toLocaleString('pt-BR') : '1.000+'} questões oficiais cadastradas
                  </p>
                </div>
              </div>

              {/* Quick stats bar */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/10 text-center">
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Simulados</span>
                  <span className="text-base font-black text-white">{totalSimuladosFatos}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Média</span>
                  <span className="text-base font-black text-emerald-400">{mediaAcertos}%</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Modo</span>
                  <span className="text-base font-black text-amber-400">Oficial</span>
                </div>
              </div>
            </motion.div>

            {/* Alternância de 3 Abas: Configurações | Raio-X | Sobre o Cargo */}
            <div className="flex bg-card border border-amber-500/30 p-1 rounded-2xl shadow-sm">
              <button
                type="button"
                onClick={() => { haptic.selection(); setAbaAtiva('config'); }}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  abaAtiva === 'config'
                    ? 'bg-amber-500 text-black font-black shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Configurações
              </button>
              <button
                type="button"
                onClick={() => { haptic.selection(); setAbaAtiva('raioX'); }}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  abaAtiva === 'raioX'
                    ? 'bg-amber-500 text-black font-black shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Raio-X
              </button>
              <button
                type="button"
                onClick={() => { haptic.selection(); setAbaAtiva('sobre'); }}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  abaAtiva === 'sobre'
                    ? 'bg-amber-500 text-black font-black shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                Sobre
              </button>
            </div>

            {abaAtiva === 'config' && (
              /* Painel de Configurações */
              <div className="rounded-3xl border border-amber-500/30 bg-card p-5 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-extrabold text-foreground border-b border-border/60 pb-3">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Personalize seu Simulado</span>
                </div>

                {/* Qtd de Questões: Todas, 10, 20, 30, 50 */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Quantidade de Questões
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    <button
                      type="button"
                      onClick={() => { haptic.selection(); setTamanhoOpcao('todas'); }}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 flex items-center justify-center ${
                        tamanhoOpcao === 'todas'
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
                          : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border/50'
                      }`}
                    >
                      Todas
                    </button>

                    {[10, 20, 30, 50].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { haptic.selection(); setTamanhoOpcao(t); }}
                        className={`h-11 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 flex items-center justify-center ${
                          tamanhoOpcao === t
                            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
                            : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border/50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtrar por Matéria & Assunto (Fluxo de Seleção Obrigatória) */}
                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Filtro por Matéria <span className="text-amber-400">* (Obrigatório)</span>
                  </label>
                  
                  {/* Botão Selecionar Matéria */}
                  <button
                    type="button"
                    onClick={() => { haptic.selection(); setSheetMaterias(true); }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selMaterias.length > 0
                        ? 'border-amber-500/60 bg-amber-500/10 text-foreground font-bold'
                        : 'border-amber-500/40 bg-card text-muted-foreground hover:border-amber-500/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Layers className={`w-4 h-4 shrink-0 ${selMaterias.length > 0 ? 'text-amber-400' : 'text-muted-foreground'}`} />
                      <span className="text-xs truncate">
                        {selMaterias.length > 0 
                          ? `Matérias: ${selMaterias.join(', ')}`
                          : 'Clique para selecionar as Matérias *'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                  </button>

                  {/* Botão Selecionar Assuntos */}
                  <button
                    type="button"
                    disabled={selMaterias.length === 0}
                    onClick={() => { haptic.selection(); setSheetAssuntos(true); }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selMaterias.length === 0
                        ? 'opacity-50 cursor-not-allowed border-border bg-secondary/30 text-muted-foreground'
                        : selAssuntos.length > 0
                          ? 'border-amber-500/60 bg-amber-500/10 text-foreground font-bold'
                          : 'border-border bg-card text-muted-foreground hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HelpCircle className={`w-4 h-4 shrink-0 ${selAssuntos.length > 0 ? 'text-amber-400' : 'text-muted-foreground'}`} />
                      <span className="text-xs truncate">
                        {selAssuntos.length > 0
                          ? `Assuntos: ${selAssuntos.join(', ')}`
                          : 'Filtrar por Assunto (Opcional)'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                  </button>
                </div>

                {/* Modo do Cronômetro — Padrão "Sem Pressão" */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Modo do Cronômetro
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setModoTempo('livre')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        modoTempo === 'livre'
                          ? 'border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500/30'
                          : 'border-border bg-secondary/50 text-muted-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                        <Timer className="w-4 h-4 text-emerald-400" /> Sem Pressão
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-1">Treine livremente sem relógio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModoTempo('cronometrado')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        modoTempo === 'cronometrado'
                          ? 'border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500/30'
                          : 'border-border bg-secondary/50 text-muted-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                        <Clock className="w-4 h-4 text-amber-400" /> Cronometrado
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-1">Conta o tempo de resolução</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'raioX' && (
              /* Aba Raio-X do Cargo */
              <div className="rounded-3xl border border-amber-500/30 bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <FileText className="w-4.5 h-4.5 text-amber-400" />
                    <span>Raio-X de Incidência de Matérias</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    {disciplinas.length} disciplinas
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Proporção de questões por disciplina neste edital/cargo:
                </p>

                {loadingDisciplinas ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
                ) : disciplinas.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">Sem dados de disciplinas ainda.</div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {disciplinas.map((d) => {
                      const perc = totalDisciplinasQuestoes > 0 ? Math.round((Number(d.total) / totalDisciplinasQuestoes) * 100) : 0;
                      return (
                        <div key={d.area} className="space-y-1.5 bg-muted/40 p-3 rounded-2xl border border-border/40">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-foreground truncate max-w-[220px]">{d.area}</span>
                            <span className="text-amber-400 font-extrabold">{d.total} q. ({perc}%)</span>
                          </div>
                          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.max(perc, 4)}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {abaAtiva === 'sobre' && (
              /* Aba Sobre o Cargo */
              <div className="rounded-3xl border border-amber-500/30 bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-extrabold text-foreground border-b border-border/60 pb-3">
                  <Info className="w-4.5 h-4.5 text-amber-400" />
                  <span>Sobre o Concurso e Cargo ({cleanNome})</span>
                </div>

                <div className="space-y-3.5 text-xs text-foreground">
                  <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/40 space-y-1">
                    <p className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px]">Requisitos Exigidos</p>
                    <p className="text-muted-foreground">Diploma de conclusão de curso superior em qualquer área reconhecido pelo MEC + CNH categoria B ou superior.</p>
                  </div>

                  <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/40 space-y-1">
                    <p className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px]">Remuneração Inicial Estimada</p>
                    <p className="text-emerald-400 font-black text-sm">R$ 10.790,00 a R$ 12.200,00 + auxílios</p>
                  </div>

                  <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/40 space-y-1">
                    <p className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px]">Etapas da Prova</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pt-0.5">
                      <li>Prova Objetiva & Discursiva (Eliminatória e Classificatória)</li>
                      <li>Teste de Aptidão Física (TAF) & Avaliação de Saúde</li>
                      <li>Curso de Formação Profissional (CFP)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Histórico Recente do Cargo */}
            {historico.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between text-sm font-bold text-foreground border-b border-border pb-2.5">
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Últimos Simulados Realizados</span>
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">{historico.length} recentes</span>
                </div>
                <div className="space-y-2">
                  {historico.map((h) => {
                    const pct = h.total > 0 ? Math.round((h.acertos / h.total) * 100) : 0;
                    const dataStr = new Date(h.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div key={h.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/60 border border-border/40">
                        <div>
                          <span className="block text-xs font-bold text-foreground">{h.titulo}</span>
                          <span className="block text-[11px] text-muted-foreground mt-0.5">{dataStr}</span>
                        </div>
                        <div className="text-right">
                          <span className={`block text-xs font-black ${pct >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {h.acertos}/{h.total} ({pct}%)
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {Math.floor(h.duracao_seg / 60)}m {h.duracao_seg % 60}s
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botão Principal Flutuante no Rodapé */}
            <div className="fixed bottom-4 left-4 right-4 z-40 max-w-3xl mx-auto">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (selMaterias.length === 0) {
                    toast.error('Selecione ao menos uma matéria para iniciar o simulado!');
                    return;
                  }
                  haptic.impact();
                  iniciar();
                }}
                className={`w-full h-15 sm:h-16 rounded-2xl font-black text-base sm:text-lg tracking-wide flex items-center justify-center gap-3 shadow-xl transition-all ${
                  selMaterias.length > 0
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black shadow-amber-500/25 active:scale-98 cursor-pointer'
                    : 'bg-muted/80 text-muted-foreground border border-border/80 opacity-75 cursor-not-allowed'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>INICIAR SIMULADO ({finalLimite} QUESTÕES)</span>
              </motion.button>
            </div>
          </>
        ) : resultadoFinal ? (
          /* Tela de Resultado Final do Simulado */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-amber-500/30 bg-card p-6 text-center space-y-6 shadow-xl"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/15 text-amber-400 mx-auto flex items-center justify-center">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-foreground">Simulado Concluído!</h2>
              <p className="text-sm text-muted-foreground mt-1">Resultado da sua prova de {cleanNome}:</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/70 rounded-2xl p-4 border border-border/50">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Acertos</span>
                <span className="text-2xl font-black text-emerald-400">{resultadoFinal.acertos}</span>
              </div>
              <div className="bg-secondary/70 rounded-2xl p-4 border border-border/50">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total</span>
                <span className="text-2xl font-black text-foreground">{resultadoFinal.total}</span>
              </div>
              <div className="bg-secondary/70 rounded-2xl p-4 border border-border/50">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Aproveitamento</span>
                <span className="text-2xl font-black text-amber-400">
                  {Math.round((resultadoFinal.acertos / resultadoFinal.total) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={iniciar}
                className="w-full h-14 rounded-2xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-all shadow-md active:scale-95"
              >
                Refazer Simulado
              </button>
              <button
                type="button"
                onClick={() => setResultadoFinal(null)}
                className="w-full h-12 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors"
              >
                Configurar Novo Simulado
              </button>
            </div>
          </motion.div>
        ) : (
          /* Runner do Simulado */
          <>
            <ResolverPadrao
              questoes={questoes}
              loading={loading}
              contexto="simulado"
              onRegistrar={registrarSimulado}
              onNovoBloco={recarregar}
              vazioTexto="Não há questões suficientes com os filtros selecionados."
            />

            <button
              type="button"
              onClick={finalizar}
              className="mt-6 w-full h-12 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Encerrar Simulado e Ver Resultado</span>
            </button>
          </>
        )}
      </div>

      {/* Sheet de Seleção de Matérias */}
      <Sheet open={sheetMaterias} onOpenChange={setSheetMaterias}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base font-black text-foreground">
              <Layers className="w-5 h-5 text-amber-400" />
              Selecione as Matérias (Obrigatório)
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3 pb-6">
            <p className="text-xs text-muted-foreground">
              Marque as disciplinas que deseja incluir neste simulado:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {disciplinas.map((d) => {
                const on = selMaterias.includes(d.area);
                return (
                  <button
                    key={d.area}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setSelMaterias((s) => (on ? s.filter((x) => x !== d.area) : [...s, d.area]));
                    }}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
                      on
                        ? 'bg-amber-500 text-black shadow-md scale-105'
                        : 'border border-border/80 bg-secondary text-foreground hover:border-amber-500/40'
                    }`}
                  >
                    {on && <Check className="h-3.5 w-3.5" />}
                    <span>{d.area}</span>
                    <span className="text-[10px] opacity-80">({d.total})</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setSheetMaterias(false)}
              className="mt-4 w-full h-12 rounded-2xl bg-amber-500 text-black font-black text-sm shadow-md"
            >
              Confirmar Matérias ({selMaterias.length})
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de Seleção de Assuntos */}
      <Sheet open={sheetAssuntos} onOpenChange={setSheetAssuntos}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base font-black text-foreground">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              Filtrar por Assunto (Opcional)
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3 pb-6">
            <p className="text-xs text-muted-foreground">
              Selecione tópicos específicos para aprofundar sua prática:
            </p>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center text-xs text-muted-foreground">
              {selMaterias.length > 0
                ? `Assuntos carregados para: ${selMaterias.join(', ')}`
                : 'Selecione primeiro as matérias.'}
            </div>

            <button
              type="button"
              onClick={() => setSheetAssuntos(false)}
              className="mt-4 w-full h-12 rounded-2xl bg-amber-500 text-black font-black text-sm shadow-md"
            >
              Confirmar Assuntos
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}


