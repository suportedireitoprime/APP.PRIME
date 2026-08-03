import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Plus, Mic, Upload, Loader2, BookMarked, Clock, ChevronRight,
  Trash2, AlertCircle, Sparkles, Check,
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoBack } from '@/hooks/useGoBack';
import { useSubscription } from '@/hooks/useSubscription';
import PremiumGate from '@/components/PremiumGate';
import {
  contarAulas, criarAula, criarDisciplina, excluirAula, excluirDisciplina,
  importarAudio, listarAulas, listarDisciplinas,
} from '@/lib/modoAula/api';
import { formatarHms } from '@/lib/modoAula/gravacao';
import type { Aula, Disciplina } from '@/lib/modoAula/types';

const STATUS_LABEL: Record<string, { texto: string; classe: string }> = {
  rascunho: { texto: 'Rascunho', classe: 'bg-muted text-muted-foreground' },
  gravando: { texto: 'Gravando', classe: 'bg-primary/15 text-primary' },
  processando: { texto: 'Processando', classe: 'bg-amber-500/15 text-amber-600' },
  transcrita: { texto: 'Pronta', classe: 'bg-emerald-500/15 text-emerald-600' },
  erro: { texto: 'Erro', classe: 'bg-destructive/15 text-destructive' },
};

export default function ModoAula() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { isPremium } = useSubscription();

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);
  const [importando, setImportando] = useState(false);

  // Formulário de início de aula
  const [abrindo, setAbrindo] = useState(false);
  const [disciplinaSel, setDisciplinaSel] = useState<string | null>(null);
  const [professor, setProfessor] = useState('');
  const [tituloAula, setTituloAula] = useState('');

  // Nova disciplina
  const [novaDisciplina, setNovaDisciplina] = useState('');
  const [salvandoDisciplina, setSalvandoDisciplina] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [d, a] = await Promise.all([listarDisciplinas(), listarAulas()]);
      setDisciplinas(d);
      setAulas(a);
      if (!disciplinaSel && d.length > 0) setDisciplinaSel(d[0].id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao carregar suas aulas.');
    } finally {
      setCarregando(false);
    }
  }, [disciplinaSel]);

  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Grátis: 1 aula completa. Depois exige assinatura. */
  const podeCriarAula = useCallback(async () => {
    if (isPremium) return true;
    const total = await contarAulas();
    if (total < 1) return true;
    setGateOpen(true);
    return false;
  }, [isPremium]);

  const disciplinaAtual = useMemo(
    () => disciplinas.find((d) => d.id === disciplinaSel) ?? null,
    [disciplinas, disciplinaSel],
  );

  useEffect(() => {
    if (disciplinaAtual?.professor && !professor) setProfessor(disciplinaAtual.professor);
  }, [disciplinaAtual]); // eslint-disable-line react-hooks/exhaustive-deps

  const adicionarDisciplina = async () => {
    const nome = novaDisciplina.trim();
    if (!nome) return;
    setSalvandoDisciplina(true);
    try {
      const nova = await criarDisciplina(nome);
      setDisciplinas((prev) => [nova, ...prev]);
      setDisciplinaSel(nova.id);
      setNovaDisciplina('');
      toast.success('Disciplina criada.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível criar a disciplina.');
    } finally {
      setSalvandoDisciplina(false);
    }
  };

  const removerDisciplina = async (id: string) => {
    try {
      await excluirDisciplina(id);
      setDisciplinas((prev) => prev.filter((d) => d.id !== id));
      if (disciplinaSel === id) setDisciplinaSel(null);
    } catch {
      toast.error('Não foi possível excluir.');
    }
  };

  const iniciarAula = async () => {
    if (!(await podeCriarAula())) return;
    const params = new URLSearchParams();
    if (disciplinaSel) params.set('disciplina', disciplinaSel);
    if (professor.trim()) params.set('professor', professor.trim());
    if (tituloAula.trim()) params.set('titulo', tituloAula.trim());
    navigate(`/modo-aula/sessao?${params.toString()}`);
  };

  const onImportar = async (arquivo: File | null) => {
    if (!arquivo) return;
    if (!(await podeCriarAula())) return;
    setImportando(true);
    try {
      const aula = await criarAula({
        titulo: arquivo.name.replace(/\.[^.]+$/, '') || 'Áudio importado',
        disciplinaId: disciplinaSel,
        professor: professor.trim() || null,
      });
      await importarAudio(aula.id, arquivo);
      toast.success('Áudio importado. Vamos transcrever.');
      navigate(`/modo-aula/aula/${aula.id}?transcrever=1`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao importar o áudio.');
    } finally {
      setImportando(false);
    }
  };

  const apagarAula = async (id: string) => {
    try {
      await excluirAula(id);
      setAulas((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error('Não foi possível excluir a aula.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title="Modo Aula"
        subtitle="Grave a aula, o app transforma em material de estudo"
        onBack={goBack}
        leading={<GraduationCap className="w-5 h-5 text-primary" />}
      />

      <main className="flex-1 px-4 pb-28 pt-4 space-y-6">
        {/* CTA principal */}
        <section className="rounded-2xl bg-primary text-primary-foreground p-5 shadow-lg">
          <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide opacity-90">
            <Sparkles className="w-4 h-4" /> Assistente de sala de aula
          </div>
          <h2 className="mt-2 text-[20px] font-bold leading-tight">
            Iniciar aula
          </h2>
          <p className="mt-1 text-[13px] leading-snug opacity-90">
            Grava o professor, transcreve tudo e deixa a aula pesquisável — mesmo com a tela bloqueada.
          </p>

          {!abrindo ? (
            <Button
              onClick={() => setAbrindo(true)}
              className="mt-4 w-full h-12 text-[15px] font-bold bg-background text-foreground hover:bg-background/90"
            >
              <Mic className="w-5 h-5 mr-2" /> Começar
            </Button>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[12px] font-semibold uppercase tracking-wide opacity-90">Disciplina</label>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {disciplinas.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDisciplinaSel(d.id)}
                      className={`shrink-0 h-11 px-4 rounded-xl text-[13px] font-semibold border transition ${
                        disciplinaSel === d.id
                          ? 'bg-background text-foreground border-transparent'
                          : 'bg-white/10 text-primary-foreground border-white/20'
                      }`}
                    >
                      {disciplinaSel === d.id && <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                      {d.nome}
                    </button>
                  ))}
                  {disciplinas.length === 0 && (
                    <span className="text-[13px] opacity-80 py-3">Crie uma disciplina abaixo.</span>
                  )}
                </div>
              </div>

              <Input
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="Professor (opcional)"
                className="h-12 bg-background text-foreground"
              />
              <Input
                value={tituloAula}
                onChange={(e) => setTituloAula(e.target.value)}
                placeholder="Tema da aula (opcional)"
                className="h-12 bg-background text-foreground"
              />

              <Button
                onClick={iniciarAula}
                className="w-full h-12 text-[15px] font-bold bg-background text-foreground hover:bg-background/90"
              >
                <Mic className="w-5 h-5 mr-2" /> Iniciar gravação
              </Button>
            </div>
          )}
        </section>

        {/* Importar áudio */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-[15px] font-bold text-foreground">Já tem o áudio?</h3>
          <p className="mt-1 text-[13px] text-muted-foreground leading-snug">
            Importe uma gravação do WhatsApp ou do gravador do celular e receba a transcrição completa.
          </p>
          <label className="mt-3 flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-border text-[14px] font-semibold text-foreground cursor-pointer active:scale-[0.99] transition">
            {importando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {importando ? 'Enviando…' : 'Escolher áudio'}
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              disabled={importando}
              onChange={(e) => void onImportar(e.target.files?.[0] ?? null)}
            />
          </label>
        </section>

        {/* Disciplinas */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
            Minhas disciplinas
          </h3>
          <div className="mt-3 space-y-2">
            {disciplinas.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookMarked className="w-4.5 h-4.5 text-primary" />
                </div>
                <button
                  onClick={() => navigate(`/modo-aula/disciplina/${d.id}`)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-[15px] font-semibold text-foreground truncate">{d.nome}</p>
                  {d.professor && (
                    <p className="text-[12px] text-muted-foreground truncate">{d.professor}</p>
                  )}
                </button>
                <button
                  onClick={() => void removerDisciplina(d.id)}
                  className="w-11 h-11 flex items-center justify-center text-muted-foreground"
                  aria-label={`Excluir ${d.nome}`}
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={novaDisciplina}
              onChange={(e) => setNovaDisciplina(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void adicionarDisciplina(); }}
              placeholder="Ex.: Direito Constitucional"
              className="h-12"
            />
            <Button
              onClick={() => void adicionarDisciplina()}
              disabled={salvandoDisciplina || !novaDisciplina.trim()}
              className="h-12 px-4"
            >
              {salvandoDisciplina ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </Button>
          </div>
        </section>

        {/* Aulas recentes */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
            Minhas aulas
          </h3>

          {carregando ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : aulas.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted-foreground leading-snug">
              Nenhuma aula ainda. Toque em <strong>Começar</strong> e grave a próxima.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              <AnimatePresence initial={false}>
                {aulas.map((a) => {
                  const st = STATUS_LABEL[a.status] ?? STATUS_LABEL.rascunho;
                  const disc = disciplinas.find((d) => d.id === a.disciplina_id);
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                    >
                      <button
                        onClick={() => navigate(`/modo-aula/aula/${a.id}`)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-[15px] font-semibold text-foreground truncate">{a.titulo}</p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${st.classe}`}>
                            {st.texto}
                          </span>
                          {disc && <span className="text-[12px] text-muted-foreground truncate">{disc.nome}</span>}
                          {a.duracao_seg > 0 && (
                            <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatarHms(a.duracao_seg)}
                            </span>
                          )}
                        </div>
                        {a.status === 'erro' && a.erro && (
                          <p className="mt-1 text-[12px] text-destructive flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {a.erro}
                          </p>
                        )}
                      </button>
                      <button
                        onClick={() => void apagarAula(a.id)}
                        className="w-11 h-11 flex items-center justify-center text-muted-foreground"
                        aria-label={`Excluir ${a.titulo}`}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      <PremiumGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        title="Modo Aula ilimitado"
        description="Você já usou sua aula gratuita. Assine para gravar e transcrever quantas aulas quiser."
        usageLabel="1 de 1 aula gratuita usada"
      />
    </div>
  );
}
