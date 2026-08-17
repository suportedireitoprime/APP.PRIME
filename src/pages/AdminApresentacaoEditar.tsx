import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdfjsLib, configurarPdfWorker, getPdfDocumentParams } from '@/lib/pdfWorkerConfig';

configurarPdfWorker(pdfjsLib);

import {
  Presentation, Upload, Loader2, Play, Check, Mic, ChevronRight, Trash2,
  BookOpen, Scale, BookMarked, Eye, EyeOff, Search, Sparkles, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import {
  iniciarApresJob, subscribeApresJob, pararApresJob, limparApresJob,
  etaSegundos, formatarEta, type ApresJobEstado,
} from '@/lib/apresentacaoJob';

type Voz = { id: string; genero: string; descricao: string; ativa?: boolean; padrao?: boolean };
type SlidePreparado = { b64: string; texto: string; thumb: string };
type Modo = 'materia' | 'lei' | 'livro';

type ResumoRow = {
  id: string; area: string; tema: string; subtema: string | null;
  markdown: string | null; exemplos: string | null; termos: string | null;
};

type ArtigoRow = { numero: string; rotulo: string | null; caput: string | null; texto?: string | null };

type LivroRow = {
  livro_tabela: string;
  livro_id: string;
  titulo: string;
  autor: string | null;
  categoria: string;
  apresentacao_id: string | null;
  total_slides: number;
  publicada: boolean;
};

type Apres = {
  id: string; titulo: string; origem: string; area: string | null; tema: string | null;
  subtema: string | null; total_slides: number; publicada: boolean; status: string;
};

const call = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('narracao', { body: { ...payload, fn: 'blog_preview' } });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
};

const AdminApresentacaoEditar = () => {
  const navigate = useNavigate();

  const [modo, setModo] = useState<Modo>('materia');
  const [step, setStep] = useState<'categoria' | 'referencia' | 'geracao'>('categoria');
  const [vozes, setVozes] = useState<Voz[]>([]);
  const [voz, setVoz] = useState('Charon');
  const [job, setJob] = useState<ApresJobEstado | null>(null);
  const [lista, setLista] = useState<Apres[]>([]);

  // matérias
  const [resumos, setResumos] = useState<ResumoRow[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [area, setArea] = useState('');
  const [tema, setTema] = useState('');
  const [resumoSel, setResumoSel] = useState<ResumoRow | null>(null);

  // leis
  const [leiId, setLeiId] = useState('');
  const [artigos, setArtigos] = useState<ArtigoRow[]>([]);
  const [buscaArtigo, setBuscaArtigo] = useState('');
  const [artigoSel, setArtigoSel] = useState<ArtigoRow | null>(null);

  // livros (clássicos)
  const [livros, setLivros] = useState<LivroRow[]>([]);
  const [carregandoLivros, setCarregandoLivros] = useState(false);
  const [buscaLivro, setBuscaLivro] = useState('');
  const [categoriaLivro, setCategoriaLivro] = useState('');
  const [livroSel, setLivroSel] = useState<LivroRow | null>(null);

  // pdf
  const [nomePdf, setNomePdf] = useState('');
  const [slides, setSlides] = useState<SlidePreparado[]>([]);
  const [lendoPdf, setLendoPdf] = useState<{ feitos: number; total: number } | null>(null);
  const [ocrAtivo, setOcrAtivo] = useState(false);

  useEffect(() => subscribeApresJob(setJob), []);

  useEffect(() => {
    (async () => {
      try {
        const v = await call({ acao: 'vozes' });
        const arr = (v?.vozes ?? []) as Voz[];
        setVozes(arr);
        setVoz(arr.find((x) => x.padrao)?.id ?? arr[0]?.id ?? 'Charon');
      } catch { /* usa Charon */ }
    })();
  }, []);

  const carregarLista = async () => {
    const { data } = await (supabase
      .from('apresentacoes_narradas') as any)
      .select('id, titulo, origem, area, tema, subtema, total_slides, publicada, status')
      .order('created_at', { ascending: false });
    setLista((data as Apres[]) ?? []);
  };
  useEffect(() => { carregarLista(); }, []);
  useEffect(() => { if (job && !job.ativo && job.concluido) { carregarLista(); limparPdf(); } }, [job?.concluido, job?.ativo]);

  // ---------- matérias ----------
  useEffect(() => {
    if (modo !== 'materia' || resumos.length) return;
    (async () => {
      setCarregando(true);
      const { data } = await supabase
        .from('resumos_juridicos')
        .select('id, area, tema, subtema, markdown, exemplos, termos')
        .order('area').order('ordem_tema').order('ordem_subtema');
      setResumos((data as ResumoRow[]) ?? []);
      setCarregando(false);
    })();
  }, [modo, resumos.length]);

  const areas = useMemo(
    () => Array.from(new Set(resumos.map((r) => r.area))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [resumos],
  );
  const temas = useMemo(
    () => Array.from(new Set(resumos.filter((r) => r.area === area).map((r) => r.tema))),
    [resumos, area],
  );
  const subtemas = useMemo(
    () => resumos.filter((r) => r.area === area && r.tema === tema),
    [resumos, area, tema],
  );

  // ---------- leis ----------
  const lei = LEIS_CATALOG.find((l) => l.id === leiId) ?? null;
  useEffect(() => {
    if (modo !== 'lei' || !lei) return;
    setArtigos([]); setArtigoSel(null); setBuscaArtigo('');
    (async () => {
      setCarregando(true);
      const { data } = await (supabase.from(lei.tabela_nome as any) as any)
        .select('numero, rotulo, caput, texto')
        .order('ordem_numero', { ascending: true })
        .limit(3000);
      setArtigos((data as ArtigoRow[]) ?? []);
      setCarregando(false);
    })();
  }, [modo, leiId]);

  // Auto-seleciona artigo se a busca for exatamente o número do artigo
  useEffect(() => {
    if (!buscaArtigo.trim() || !artigos.length) return;
    const q = buscaArtigo.trim().toLowerCase();
    const exato = artigos.find((a) => String(a.numero).trim().toLowerCase() === q);
    if (exato) {
      setArtigoSel(exato);
    }
  }, [buscaArtigo, artigos]);

  const artigosFiltrados = useMemo(() => {
    const q = buscaArtigo.trim().toLowerCase();
    const base = q ? artigos.filter((a) => String(a.numero).toLowerCase().includes(q)) : artigos;
    return base.slice(0, 120);
  }, [artigos, buscaArtigo]);

  // ---------- livros (clássicos) ----------
  useEffect(() => {
    if (livros.length || carregandoLivros) return;
    (async () => {
      setCarregandoLivros(true);
      try {
        const res = await call({ acao: 'apres-livros' });
        setLivros((res?.livros ?? []) as LivroRow[]);
      } catch (e) {
        toast.error('Erro ao carregar lista de livros');
      } finally {
        setCarregandoLivros(false);
      }
    })();
  }, [livros.length, carregandoLivros]);

  const categoriasLivros = useMemo(() => {
    const set = new Set<string>();
    livros.forEach((l) => { if (l.categoria) set.add(l.categoria); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [livros]);

  const livrosFiltrados = useMemo(() => {
    let list = livros;
    if (categoriaLivro) {
      list = list.filter((l) => l.categoria === categoriaLivro);
    }
    const q = buscaLivro.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          l.titulo.toLowerCase().includes(q) ||
          (l.autor && l.autor.toLowerCase().includes(q)) ||
          (l.categoria && l.categoria.toLowerCase().includes(q))
      );
    }
    return list;
  }, [livros, categoriaLivro, buscaLivro]);

  // ---------- referência escolhida ----------
  const referencia = useMemo(() => {
    if (modo === 'materia') {
      if (resumoSel) {
        const texto = [resumoSel.markdown, resumoSel.exemplos, resumoSel.termos].filter(Boolean).join('\n\n');
        return {
          id: resumoSel.id,
          titulo: resumoSel.subtema || resumoSel.tema,
          area: resumoSel.area,
          tema: resumoSel.tema,
          subtema: resumoSel.subtema,
          texto,
          livroTabela: 'resumos_juridicos',
          livroId: resumoSel.id,
        };
      }
      if (area && tema) {
        return {
          id: `materia:${area}:${tema}`,
          titulo: `${area} — ${tema}`,
          area,
          tema,
          subtema: null,
          texto: `${area} · ${tema}`,
          livroTabela: 'resumos_juridicos',
          livroId: `materia:${area}:${tema}`,
        };
      }
    }
    if (modo === 'lei' && lei) {
      if (artigoSel) {
        const texto = [artigoSel.rotulo, artigoSel.caput, artigoSel.texto].filter(Boolean).join('\n');
        return {
          id: `${lei.tabela_nome}:${artigoSel.numero}`,
          titulo: `${lei.sigla} — Art. ${artigoSel.numero}`,
          area: lei.nome,
          tema: `Art. ${artigoSel.numero}`,
          subtema: artigoSel.rotulo,
          texto,
          livroTabela: lei.tabela_nome,
          livroId: `art:${artigoSel.numero}`,
        };
      }
      return {
        id: lei.tabela_nome,
        titulo: `${lei.sigla} — ${lei.nome}`,
        area: lei.nome,
        tema: lei.sigla,
        subtema: lei.nome,
        texto: `${lei.nome} (${lei.sigla}) - ${lei.descricao}`,
        livroTabela: lei.tabela_nome,
        livroId: `lei:${lei.id}`,
      };
    }
    if (modo === 'livro' && livroSel) {
      return {
        id: `${livroSel.livro_tabela}:${livroSel.livro_id}`,
        titulo: livroSel.titulo,
        area: 'Clássicos Jurídicos',
        tema: livroSel.categoria || 'Livro Clássico',
        subtema: livroSel.autor,
        texto: `Livro: ${livroSel.titulo}${livroSel.autor ? ` — Autor: ${livroSel.autor}` : ''}`,
        livroTabela: livroSel.livro_tabela,
        livroId: livroSel.livro_id,
      };
    }
    return null;
  }, [modo, resumoSel, area, tema, lei, artigoSel, livroSel]);

  const limparPdf = () => { setSlides([]); setNomePdf(''); setLendoPdf(null); };

  // Etapa: ler o PDF (imagens dos slides) + OCR Mistral por página
  const lerPdf = async (file: File) => {
    limparPdf();
    setNomePdf(file.name);
    try {
      configurarPdfWorker(pdfjsLib);
      const buf = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument(getPdfDocumentParams(buf)).promise;
      const total = pdf.numPages;
      setLendoPdf({ feitos: 0, total });
      const preparados: SlidePreparado[] = [];
      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const dataUrl = canvas.toDataURL('image/png');
        const content = await page.getTextContent();
        const texto = (content.items as any[]).map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();
        preparados.push({ b64: dataUrl.split(',')[1], texto, thumb: dataUrl });
        setLendoPdf({ feitos: i, total });
      }

      // OCR (Mistral) — essencial quando o PDF é só imagem
      setOcrAtivo(true);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let bin = '';
        for (let i = 0; i < bytes.length; i += 8192) {
          bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
        }
        const res = await call({ acao: 'apres-ocr', pdf_b64: btoa(bin), nome: file.name });
        const paginas = (res?.paginas ?? []) as string[];
        paginas.forEach((t, i) => {
          if (preparados[i] && t && t.length > (preparados[i].texto?.length ?? 0)) preparados[i].texto = t;
        });
        toast.success(`OCR concluído em ${paginas.length} página(s).`);
      } catch (e) {
        toast.warning(`OCR indisponível (${e instanceof Error ? e.message : 'erro'}) — usando o texto do PDF.`);
      } finally {
        setOcrAtivo(false);
      }

      setSlides(preparados);
      toast.success(`${preparados.length} slides prontos. Escolha a voz e gere a narração.`);
    } catch (e) {
      limparPdf();
      toast.error(e instanceof Error ? e.message : 'Erro ao ler o PDF');
    } finally {
      setLendoPdf(null);
    }
  };

  const gerar = async () => {
    if (!referencia || !slides.length) return;
    toast.info('Geração iniciada — continua rodando mesmo se você sair da tela.');
    await iniciarApresJob({
      livroTabela: referencia.livroTabela,
      livroId: referencia.livroId,
      titulo: referencia.titulo,
      voz,
      slides,
      extra: {
        origem: modo,
        area: referencia.area,
        tema: referencia.tema,
        subtema: referencia.subtema,
        referencia_id: referencia.id,
        referencia_texto: referencia.texto,
        descricao: modo === 'materia'
          ? `${referencia.area} · ${referencia.tema}`
          : modo === 'lei'
            ? `${referencia.area}`
            : `Clássicos · ${referencia.subtema || 'Livro'}`,
      },
    });
  };

  const excluir = async (a: Apres) => {
    try {
      await call({ acao: 'apres-excluir', apresentacao_id: a.id });
      setLista((prev) => prev.filter((x) => x.id !== a.id));
      setLivros((prev) => prev.map((l) => l.apresentacao_id === a.id ? { ...l, apresentacao_id: null } : l));
      toast.success('Apresentação removida');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  };

  const alternarPublicacao = async (a: Apres) => {
    try {
      await call({ acao: 'apres-publicar', apresentacao_id: a.id, publicada: !a.publicada });
      setLista((prev) => prev.map((x) => (x.id === a.id ? { ...x, publicada: !a.publicada } : x)));
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  };

  const pct = job ? Math.round((job.feitos / Math.max(job.total, 1)) * 100) : 0;
  const pctPdf = lendoPdf ? Math.round((lendoPdf.feitos / Math.max(lendoPdf.total, 1)) * 100) : 0;
  const ocupado = !!job?.ativo || !!lendoPdf || ocrAtivo;

  const Passo = ({ n, titulo, ok, ativo }: { n: number; titulo: string; ok?: boolean; ativo?: boolean }) => (
    <div className="flex items-center gap-2">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${ok ? 'bg-primary text-primary-foreground' : ativo ? 'border border-primary text-primary' : 'border border-border text-muted-foreground'}`}>
        {ok ? <Check className="w-3.5 h-3.5" /> : n}
      </span>
      <span className={`font-heading text-sm font-bold ${ativo || ok ? '' : 'text-muted-foreground'}`}>{titulo}</span>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background pb-28">
      <PageHeader
        title="Apresentação Editar"
        subtitle="Selecione Leis, Matérias ou Livros → Envie o PDF → Gere a Narração"
        onBack={() => navigate('/admin-funcoes')}
      />

      {(job || lendoPdf || ocrAtivo) && (
        <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border p-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between text-xs font-body mb-2">
              <span>
                {lendoPdf
                  ? `Lendo slides do PDF… ${lendoPdf.feitos}/${lendoPdf.total}`
                  : ocrAtivo
                    ? 'Lendo o conteúdo com OCR (Mistral)…'
                    : `${job!.ultimaMensagem} ${job!.feitos}/${job!.total} · ${pct}%`}
              </span>
              {job?.ativo && <button onClick={pararApresJob} className="text-destructive font-semibold">Parar</button>}
              {job && !job.ativo && <button onClick={limparApresJob} className="text-muted-foreground font-semibold">Fechar</button>}
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${lendoPdf ? pctPdf : ocrAtivo ? 100 : pct}%` }} />
            </div>
            {job?.ativo && (
              <p className="mt-1.5 text-[11px] font-body text-muted-foreground">
                Tempo estimado restante: {formatarEta(etaSegundos(job))} · continua em segundo plano
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 space-y-4">


        {/* 1 — Categorias Responsivas (3 Opções) ou Referência */}
        {step === 'categoria' ? (
          <div className="space-y-6 pt-4">
            <div className="text-center space-y-2">
              <Passo n={1} titulo="Escolha a categoria" ativo />
              <p className="text-muted-foreground text-sm">Qual o tipo de apresentação você deseja gerar ou editar?</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { id: 'materia' as Modo, label: 'Matérias', desc: 'Resumos por área e tema', icon: BookOpen },
                { id: 'lei' as Modo, label: 'Leis', desc: 'Constituição e Códigos', icon: Scale },
                { id: 'livro' as Modo, label: 'Livros (Clássicos)', desc: 'Biblioteca Jurídica', icon: BookMarked },
              ]).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    disabled={ocupado}
                    onClick={() => {
                      setModo(m.id);
                      setResumoSel(null);
                      setArtigoSel(null);
                      setLivroSel(null);
                      setStep('referencia');
                    }}
                    className="bg-card border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center group h-40 disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                      <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg font-heading">{m.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Passo n={1} titulo="Escolha a Referência" ok={!!referencia} ativo={!referencia} />
              <button
                onClick={() => setStep('categoria')}
                className="px-3 py-1.5 rounded-xl border border-border hover:bg-accent transition text-xs font-semibold text-muted-foreground"
              >
                ← Voltar
              </button>
            </div>

            {/* Painel da Categoria 1: Matérias */}
            {modo === 'materia' && (
              <div className="space-y-3 pt-2">
                <select
                  value={area}
                  onChange={(e) => { setArea(e.target.value); setTema(''); setResumoSel(null); }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                >
                  <option value="">{carregando ? 'Carregando áreas…' : 'Escolha a área'}</option>
                  {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>

                {!!area && (
                  <select
                    value={tema}
                    onChange={(e) => { setTema(e.target.value); setResumoSel(null); }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Escolha o tema</option>
                    {temas.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}

                {!!tema && (
                  <div className="rounded-xl border border-border divide-y divide-border max-h-72 overflow-y-auto bg-background/50">
                    {subtemas.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { setResumoSel(r); setStep('geracao'); }}
                        className={`w-full text-left p-3 flex items-center gap-2 transition ${resumoSel?.id === r.id ? 'bg-primary/10' : 'hover:bg-accent/40'}`}
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-body font-semibold truncate">{r.subtema || r.tema}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {(r.markdown?.length ?? 0) > 0 ? `${Math.round((r.markdown!.length) / 100) / 10}k caracteres` : 'sem resumo salvo'}
                          </span>
                        </span>
                        {resumoSel?.id === r.id ? <Check className="w-4 h-4 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Painel da Categoria 2: Leis */}
            {modo === 'lei' && (
              <div className="space-y-3 pt-2">
                <select
                  value={leiId}
                  onChange={(e) => setLeiId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                >
                  <option value="">Escolha a lei</option>
                  {LEIS_CATALOG.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>

                {!!lei && (
                  <>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={buscaArtigo}
                        onChange={(e) => setBuscaArtigo(e.target.value)}
                        placeholder="Buscar artigo (ex.: 1 ou 121)"
                        className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="rounded-xl border border-border divide-y divide-border max-h-72 overflow-y-auto bg-background/50">
                      {carregando && <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
                      {artigosFiltrados.map((a) => (
                        <button
                          key={a.numero}
                          onClick={() => { setArtigoSel(a); setStep('geracao'); }}
                          className={`w-full text-left p-3 flex items-center gap-2 transition ${artigoSel?.numero === a.numero ? 'bg-primary/10' : 'hover:bg-accent/40'}`}
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-body font-semibold">Art. {a.numero}</span>
                            <span className="block text-[11px] text-muted-foreground truncate">{a.rotulo || a.caput}</span>
                          </span>
                          {artigoSel?.numero === a.numero ? <Check className="w-4 h-4 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Painel da Categoria 3: Livros (Clássicos da Literatura Jurídica) */}
            {modo === 'livro' && (
              <div className="space-y-3 pt-2">
                {carregandoLivros ? (
                  <div className="p-6 flex justify-center items-center gap-2 text-sm font-body text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" /> Carregando biblioteca de clássicos…
                  </div>
                ) : !categoriaLivro ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categoriasLivros.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setCategoriaLivro(cat); setBuscaLivro(''); }}
                        className="rounded-xl border border-border bg-background p-4 text-left flex items-center gap-3 transition hover:border-primary/50 hover:bg-accent/40"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <BookMarked className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-heading font-medium text-sm text-foreground">{cat}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 items-center mb-3">
                      <button
                        onClick={() => { setCategoriaLivro(''); setLivroSel(null); }}
                        className="px-3 py-2 rounded-xl border border-border hover:bg-accent transition text-xs font-semibold text-muted-foreground shrink-0"
                      >
                        ← Categorias
                      </button>
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={buscaLivro}
                          onChange={(e) => setBuscaLivro(e.target.value)}
                          placeholder={`Buscar em "${categoriaLivro}"...`}
                          className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm font-body focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border divide-y divide-border max-h-80 overflow-y-auto bg-background/50">
                      {!livrosFiltrados.length && (
                        <div className="p-4 text-center text-xs text-muted-foreground font-body">
                          Nenhum livro encontrado nesta categoria.
                        </div>
                      )}
                      {livrosFiltrados.map((l) => {
                        const sel = livroSel?.livro_id === l.livro_id && livroSel?.livro_tabela === l.livro_tabela;
                        return (
                          <button
                            key={`${l.livro_tabela}:${l.livro_id}`}
                            onClick={() => { setLivroSel(l); setStep('geracao'); }}
                            className={`w-full text-left p-3.5 flex items-center justify-between gap-3 transition ${
                              sel ? 'bg-primary/10' : 'hover:bg-accent/40'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="block text-sm font-bold font-heading truncate text-foreground">
                                  {l.titulo}
                                </span>
                                {l.apresentacao_id && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-semibold shrink-0">
                                    Já possui apresentação
                                  </span>
                                )}
                              </div>
                              <span className="block text-xs text-muted-foreground font-body truncate mt-0.5">
                                {l.autor ? `Autor: ${l.autor}` : 'Clássico Jurídico'}
                              </span>
                            </div>
                            {sel ? <Check className="w-5 h-5 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'geracao' && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Passo n={1} titulo="Geração de Conteúdo" ok={!!referencia} ativo={true} />
              <button
                onClick={() => setStep('referencia')}
                className="px-3 py-1.5 rounded-xl border border-border hover:bg-accent transition text-xs font-semibold text-muted-foreground"
              >
                ← Mudar Referência
              </button>
            </div>
            
            {referencia && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
                <span className="text-xs font-body text-muted-foreground truncate">
                  Referência ativa: <strong className="text-primary">{referencia.titulo}</strong>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary text-primary-foreground shrink-0 uppercase">
                  {modo}
                </span>
              </div>
            )}
            {/* 2 — PDF */}
            <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
              <Passo n={2} titulo="Envie o PDF da apresentação" ok={!!slides.length} ativo={!!referencia && !slides.length} />
          <label className={`flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-sm font-body transition ${!referencia || ocupado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-accent/20'}`}>
            <Upload className="w-4 h-4 text-primary" />
            {nomePdf || 'Selecionar PDF da Apresentação'}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={!referencia || ocupado}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) lerPdf(f); e.currentTarget.value = ''; }}
            />
          </label>
          {!!slides.length && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {slides.map((s, i) => (
                <img key={i} src={s.thumb} alt={`Slide ${i + 1}`} className="h-20 rounded-lg border border-border shrink-0" />
              ))}
            </div>
          )}
        </div>

        {/* 3 — voz e geração */}
        <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
          <Passo n={3} titulo="Voz e narração" ativo={!!slides.length} />
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary shrink-0" />
            <select
              value={voz}
              onChange={(e) => setVoz(e.target.value)}
              disabled={ocupado}
              className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary text-ellipsis"
            >
              {(vozes.length ? vozes : [{ id: 'Charon', genero: '', descricao: 'Padrão' } as Voz]).map((v) => (
                <option key={v.id} value={v.id}>{v.id} — {v.descricao}</option>
              ))}
            </select>
          </div>
          <button
            onClick={gerar}
            disabled={!referencia || !slides.length || ocupado}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3.5 font-heading font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-md hover:bg-primary/90 transition"
          >
            {job?.ativo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
            </div>
          </div>
        )}

        {/* Lista de Apresentações Criadas */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="font-heading font-bold text-sm flex items-center gap-2">
            <Presentation className="w-4 h-4 text-primary" /> Apresentações criadas
          </h2>
          {!lista.length && <p className="text-xs text-muted-foreground font-body">Nenhuma apresentação criada ainda.</p>}
          {lista.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-3 flex items-center gap-3 bg-background/40 hover:bg-background/80 transition">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-body font-semibold truncate">{a.titulo}</span>
                <span className="block text-[11px] text-muted-foreground truncate">
                  {[a.origem?.toUpperCase(), a.area, a.tema].filter(Boolean).join(' · ')} · {a.total_slides} slides · {a.status}
                </span>
              </span>
              <button onClick={() => alternarPublicacao(a)} className="p-2 text-muted-foreground hover:text-primary transition" aria-label="Publicar">
                {a.publicada ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => excluir(a)} className="p-2 text-destructive hover:opacity-80 transition" aria-label="Excluir">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminApresentacaoEditar;
