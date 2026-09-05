import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookOpen, Sparkles, RefreshCcw, Loader2,
  CheckCircle2, AlertCircle, Clock, ChevronRight, Eye, ArrowLeft, Search, CheckSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBibliotecaLeituraStatus, type LivroLeituraItem } from '@/hooks/useBibliotecaLeituraStatus';
import LeitorNativo from '@/components/biblioteca/LeitorNativo';
import FilaLeituraNativaPanel from '@/components/admin/FilaLeituraNativaPanel';

type Filtro = 'todos' | 'pendente' | 'processando' | 'pronto' | 'erro' | 'refino-pendente';

const badgeFor = (it: LivroLeituraItem) => {
  const s = it.leitura?.status;
  const r = it.leitura?.refino_status;
  if (s === 'processando') return { label: 'OCR rodando', tone: 'bg-amber-500/20 text-amber-200 border-amber-500/30', Icon: Loader2, spin: true };
  if (s === 'erro') return { label: 'Erro OCR', tone: 'bg-red-500/20 text-red-200 border-red-500/30', Icon: AlertCircle };
  if (r === 'processando') return { label: 'Refino rodando', tone: 'bg-blue-500/20 text-blue-200 border-blue-500/30', Icon: Loader2, spin: true };
  if (r === 'erro') return { label: 'Erro refino', tone: 'bg-red-500/20 text-red-200 border-red-500/30', Icon: AlertCircle };
  if (s === 'pronto' && r === 'pronto') return { label: 'Pronto (com cap.)', tone: 'bg-emerald-500/20 text-emerald-300 font-medium border-emerald-500/30', Icon: CheckCircle2 };
  if (s === 'pronto') return { label: 'OCR ok', tone: 'bg-emerald-500/20 text-emerald-300 font-medium border-emerald-500/30', Icon: CheckCircle2 };
  return { label: 'Pendente', tone: 'bg-white/5 text-white/60 border-white/10', Icon: Clock };
};

const AdminLeituraNativa = () => {
  const navigate = useNavigate();
  const { items, loading, reload } = useBibliotecaLeituraStatus();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openColecao, setOpenColecao] = useState<string | null>(null);
  const [preview, setPreview] = useState<LivroLeituraItem | null>(null);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return items.filter((it) => {
      if (!it.download) return false;
      const s = it.leitura?.status; const r = it.leitura?.refino_status;
      if (filtro === 'pendente' && s) return false;
      if (filtro === 'processando' && s !== 'processando' && r !== 'processando') return false;
      if (filtro === 'pronto' && !(s === 'pronto' && r === 'pronto')) return false;
      if (filtro === 'erro' && s !== 'erro' && r !== 'erro') return false;
      if (filtro === 'refino-pendente' && !(s === 'pronto' && r !== 'pronto')) return false;
      if (q) {
        const hay = `${it.titulo} ${it.autor ?? ''} ${it.colecao.label}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, busca, filtro]);

  // Agrupa por coleção
  const grupos = useMemo(() => {
    const map = new Map<string, { id: string; label: string; itens: LivroLeituraItem[] }>();
    for (const it of filtered) {
      const g = map.get(it.colecao.id) ?? { id: it.colecao.id, label: it.colecao.label, itens: [] };
      g.itens.push(it);
      map.set(it.colecao.id, g);
    }
    return Array.from(map.values()).sort((a, b) => {
      const aPendentes = a.itens.filter(i => (i.download) && !(i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto')).length;
      const bPendentes = b.itens.filter(i => (i.download) && !(i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto')).length;
      if (aPendentes > 0 && bPendentes === 0) return -1;
      if (aPendentes === 0 && bPendentes > 0) return 1;
      return a.label.localeCompare(b.label, 'pt-BR');
    });
  }, [filtered]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pronto = filtered.filter((i) => i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto').length;
    const proc = filtered.filter((i) => i.leitura?.status === 'processando' || i.leitura?.refino_status === 'processando').length;
    const erro = filtered.filter((i) => i.leitura?.status === 'erro' || i.leitura?.refino_status === 'erro').length;
    return { total, pronto, proc, erro };
  }, [filtered]);

  const keyOf = (it: LivroLeituraItem) => `${it.colecao.table}::${it.id}`;

  const toggle = (it: LivroLeituraItem) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = keyOf(it);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const toggleGrupo = (grp: { itens: LivroLeituraItem[] }) => {
    setSelected((prev) => {
      const ks = grp.itens.map(keyOf);
      const all = ks.every((k) => prev.has(k));
      const next = new Set(prev);
      if (all) ks.forEach((k) => next.delete(k));
      else ks.forEach((k) => next.add(k));
      return next;
    });
  };

  async function invokeFn(name: string, body: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw error;
    return data;
  }

  async function processar(it: LivroLeituraItem, tipo: 'ocr' | 'refino' | 'completo') {
    const pdf_url = it.download || '';
    if ((tipo === 'ocr' || tipo === 'completo') && !pdf_url) {
      toast.error('Livro sem PDF'); return;
    }
    try {
      if (tipo === 'ocr' || tipo === 'completo') {
        await invokeFn('biblioteca-ocr-mistral', {
          livro_id: String(it.id), livro_tabela: it.colecao.table,
          pdf_url, titulo: it.titulo, force: true,
        });
      }
      if (tipo === 'refino' || tipo === 'completo') {
        const rodarOcr = async () => {
          if (!pdf_url) { toast.error('Livro sem OCR e sem PDF disponível'); return false; }
          toast.message('OCR ainda não rodou — disparando OCR + refino…');
          await invokeFn('biblioteca-ocr-mistral', {
            livro_id: String(it.id), livro_tabela: it.colecao.table,
            pdf_url, titulo: it.titulo, force: true,
          });
          return true;
        };
        try {
          const res: any = await invokeFn('biblioteca-ocr-mistral', {
            action: 'refino',
            livro_id: String(it.id), livro_tabela: it.colecao.table, force: true,
          });
          if (res?.status === 'sem_ocr') {
            if (!(await rodarOcr())) return;
          }
        } catch (err: any) {
          const msg = String(err?.message || '');
          const semConteudo = /conteudo_md vazio|Rode o OCR|Sem conte[úu]do para refinar|Leitura nativa n[ãa]o encontrada/i.test(msg);
          if (semConteudo) {
            if (!(await rodarOcr())) return;
          } else {
            throw err;
          }
        }
      }
      toast.success('Processamento disparado');
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao disparar');
    }
  }

  async function enfileirar(alvos: LivroLeituraItem[]) {
    const comPdf = alvos.filter((it) => it.download);
    if (!comPdf.length) { toast.error('Nenhum livro com PDF disponível'); return false; }
    const rows = comPdf.map((it, idx) => ({
      livro_tabela: it.colecao.table,
      livro_id: String(it.id),
      pdf_url: it.download || null,
      titulo: it.titulo,
      tipo: 'completo',
      scheduled_for: new Date(Date.now() + idx * 1000).toISOString(),
    }));
    const { error } = await supabase.from('biblioteca_leitura_jobs' as any).insert(rows);
    if (error) { toast.error(error.message); return false; }
    toast.success(`${rows.length} livro(s) enfileirados`);
    setSelected(new Set());
    return true;
  }

  const renderMaster = () => (
    <div className="px-4 py-4 space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Livros com PDF" value={stats.total} tone="text-white" />
        <StatCard label="Total Prontos" value={stats.pronto} tone="text-emerald-400" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white/90">Coleções</h2>
          <Button variant="ghost" size="sm" onClick={reload} className="text-white/50 hover:text-white h-8 w-8 p-0">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 text-white/40 animate-spin" /></div>
        ) : grupos.length === 0 ? (
          <div className="text-center text-white/50 py-10">Nenhum livro com PDF encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grupos.map(g => {
              const prontos = g.itens.filter((i) => i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto').length;
              const pendentes = g.itens.filter((i) => (i.download) && !(i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto')).length;

              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setBusca('');
                    setFiltro('todos');
                    setOpenColecao(g.id);
                  }}
                  className={`relative group rounded-2xl border p-4 text-left transition-all overflow-hidden
                    ${pendentes > 0 ? 'border-yellow-500/30 bg-yellow-500/[0.03] hover:bg-yellow-500/[0.06] hover:border-yellow-500/50' 
                                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <h3 className="font-medium text-base text-white/90 leading-tight group-hover:text-white transition-colors">{g.label}</h3>
                    {pendentes > 0 && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                        {pendentes} pendentes
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-end justify-between mt-auto">
                    <div className="space-y-1">
                      <div className="text-xs text-white/40">{g.itens.length} livros</div>
                      <div className="text-xs text-emerald-400/80">{prontos} prontos</div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <ChevronRight className="h-4 w-4 text-white/50 group-hover:text-white" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderDetail = () => {
    const g = grupos.find(x => x.id === openColecao);
    if (!g) {
      setOpenColecao(null);
      return null;
    }

    const pendentesGrupo = g.itens.filter((i) => (i.download) && !(i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto'));
    const selecionadosGrupo = g.itens.filter((i) => selected.has(keyOf(i)));
    
    // Sort so pendentes are first
    const sortedItens = [...g.itens].sort((a, b) => {
      const aPend = (a.download) && !(a.leitura?.status === 'pronto' && a.leitura?.refino_status === 'pronto') ? 1 : 0;
      const bPend = (b.download) && !(b.leitura?.status === 'pronto' && b.leitura?.refino_status === 'pronto') ? 1 : 0;
      if (aPend > bPend) return -1;
      if (aPend < bPend) return 1;
      return a.titulo.localeCompare(b.titulo, 'pt-BR');
    });

    return (
      <div className="animate-in fade-in slide-in-from-right-8 duration-300 pb-32">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setOpenColecao(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold truncate text-white">{g.label}</h2>
            <div className="text-[10px] text-white/50">{g.itens.length} livros • {pendentesGrupo.length} pendentes</div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Fila Engine */}
          <FilaLeituraNativaPanel
            key={g.id}
            onRefresh={reload}
            livroTabela={g.itens[0]?.colecao.table}
            titulo={g.label}
            onAutoEnqueue={pendentesGrupo.length > 0 ? () => enfileirar(pendentesGrupo) : undefined}
          />

          {/* Quick Actions & Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-yellow-400 text-black hover:bg-yellow-300 h-8"
                disabled={!pendentesGrupo.length}
                onClick={async () => {
                  const ok = await enfileirar(pendentesGrupo);
                  if (ok) toast.info('Enfileirados! Role para cima e clique em "Rodar fila".');
                }}
              >
                <Sparkles className="h-4 w-4 mr-1.5" /> 
                Enfileirar {pendentesGrupo.length} pendentes
              </Button>
              {selecionadosGrupo.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 bg-white/5 border-white/10 hover:bg-white/10 text-xs"
                  onClick={async () => {
                    const ok = await enfileirar(selecionadosGrupo);
                    if (ok) toast.info('Enfileirados com sucesso!');
                  }}
                >
                  Enfileirar {selecionadosGrupo.length} selecionados
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Buscar livro..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-8 pl-8 bg-white/5 border-white/10 text-white text-xs focus-visible:ring-yellow-400/30"
                />
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white/50" onClick={() => toggleGrupo(g)} title="Selecionar todos desta coleção">
                <CheckSquare className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {(['todos','pendente','processando','pronto','erro'] as Filtro[]).map((f) => (
                <Chip key={f} active={filtro === f} onClick={() => setFiltro(f)}>{f}</Chip>
              ))}
            </div>
          </div>

          {/* Livros List */}
          <div className="space-y-2">
            {sortedItens.map((it) => {
              const k = keyOf(it);
              const b = badgeFor(it);
              const B = b.Icon;
              const podePrev = it.leitura?.status === 'pronto';
              const finalizado = it.leitura?.status === 'pronto' && it.leitura?.refino_status === 'pronto';
              const isSelected = selected.has(k);

              return (
                <div 
                  key={k} 
                  onClick={() => toggle(it)}
                  className={`rounded-xl border p-3 flex gap-3 items-center transition-all cursor-pointer select-none
                    ${isSelected ? 'border-yellow-400/50 bg-yellow-400/[0.05]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                    ${isSelected ? 'bg-yellow-400 border-yellow-400 text-black' : 'border-white/20 bg-black/20'}`}>
                    {isSelected && <CheckSquare className="h-3 w-3" />}
                  </div>
                  
                  <div className="w-10 h-14 rounded overflow-hidden bg-white/5 shrink-0 flex items-center justify-center pointer-events-none">
                    {it.capa ? (
                      <img src={it.capa} alt="" className="w-full h-full object-cover opacity-80" loading="lazy" />
                    ) : <BookOpen className="h-4 w-4 text-white/20" />}
                  </div>
                  
                  <div className="flex-1 min-w-0 py-1">
                    <div className="text-[13px] font-medium leading-tight mb-1 text-white/90 truncate">{it.titulo}</div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border ${b.tone}`}>
                        <B className={`h-2.5 w-2.5 ${b.spin ? 'animate-spin' : ''}`} />
                        {b.label}
                      </span>
                      {(it.leitura?.erro_detalhe || it.leitura?.refino_erro) && (
                        <span className="text-[9px] text-red-300 max-w-[120px] truncate" title={it.leitura.erro_detalhe || it.leitura.refino_erro}>{it.leitura.erro_detalhe || it.leitura.refino_erro}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5 shrink-0">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className={`h-8 w-8 rounded-full ${finalizado ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10' : 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10'}`}
                      onClick={(e) => { e.stopPropagation(); processar(it, 'completo'); }}
                      title={finalizado ? 'Reextrair OCR' : 'Extrair OCR'}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30"
                      disabled={!podePrev}
                      onClick={(e) => { e.stopPropagation(); setPreview(it); }}
                      title="Ver Prévia Nativa"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {sortedItens.length === 0 && (
              <div className="text-center py-12 text-white/40 text-sm">
                Nenhum livro corresponde à busca/filtro atual.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white overflow-hidden flex flex-col">
      {!openColecao && <PageHeader title="Admin Leitura Nativa" onBack={() => navigate('/admin-funcoes')} />}

      <div className="flex-1 overflow-y-auto">
        {openColecao ? renderDetail() : renderMaster()}
      </div>

      {preview && (
        <LeitorNativo
          livroId={String(preview.id)}
          livroTabela={preview.colecao.table}
          pdfUrl={preview.download || ''}
          titulo={preview.titulo}
          autor={preview.autor ?? undefined}
          capa={preview.capa ?? undefined}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
};

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors shrink-0 ${
      active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
    }`}
  >
    {children}
  </button>
);

const StatCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-col justify-center">
    <div className={`text-3xl font-bold ${tone}`}>{value}</div>
    <div className="text-xs text-white/50 mt-1">{label}</div>
  </div>
);

export default AdminLeituraNativa;
