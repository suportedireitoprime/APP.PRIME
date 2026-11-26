import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  Film,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Volume2,
} from 'lucide-react';
import animacoesCatalogRaw from '@/data/animacoesCatalog.json';
import type { AnimacaoItem } from '@/data/animacoesTypes';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

const animacoesCatalog = animacoesCatalogRaw as AnimacaoItem[];

interface AnimacaoLabStudioProps {
  onVoltar: () => void;
}

type StudioTab = 'preview' | 'codigo' | 'ajustes' | 'audios';

export const AnimacaoLabStudio: React.FC<AnimacaoLabStudioProps> = ({ onVoltar }) => {
  const [busca, setBusca] = useState('');
  const [selecionada, setSelecionada] = useState<AnimacaoItem | null>(
    () => animacoesCatalog.find((a) => a.slug.includes('art-4')) || animacoesCatalog[0] || null
  );
  const [tab, setTab] = useState<StudioTab>('preview');
  const [htmlOriginal, setHtmlOriginal] = useState('');
  const [htmlEditado, setHtmlEditado] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [copiado, setCopiado] = useState(false);

  // Ajustes rápidos visuais injetados no preview
  const [mostrarLegenda, setMostrarLegenda] = useState(false);
  const [mostrarControles, setMostrarControles] = useState(true);
  const [corFundo, setCorFundo] = useState('#09090b');
  const [velocidade, setVelocidade] = useState(1);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return animacoesCatalog;
    return animacoesCatalog.filter(
      (a) =>
        a.titulo.toLowerCase().includes(q) ||
        (a.tituloHtml || '').toLowerCase().includes(q) ||
        (a.artigoRef || '').toLowerCase().includes(q) ||
        a.categoria.toLowerCase().includes(q)
    );
  }, [busca]);

  useEffect(() => {
    if (!selecionada) return;
    let cancelado = false;
    setCarregando(true);
    fetch(`${selecionada.htmlR2Url}?nocache=${Date.now()}`)
      .then((r) => r.text())
      .then((txt) => {
        if (cancelado) return;
        setHtmlOriginal(txt);
        setHtmlEditado(txt);
        setPreviewKey((k) => k + 1);
      })
      .catch(() => {
        if (!cancelado) toast.error('Erro ao carregar HTML da animação do R2');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [selecionada?.slug]);

  const htmlComAjustes = useMemo(() => {
    if (!htmlEditado) return '';
    const labCss = `<style id="lab-live-tweaks">
      html, body { background: ${corFundo} !important; }
      ${mostrarLegenda ? '.caption, #caption { display: block !important; }' : '.caption, #caption { display: none !important; }'}
      ${mostrarControles ? '.controls, #controls { display: flex !important; }' : '.controls, #controls { display: none !important; }'}
    </style>
    <script id="lab-speed-tweaks">
      (function(){
        var rate = ${velocidade};
        if (rate !== 1) {
          var origPlay = HTMLMediaElement.prototype.play;
          HTMLMediaElement.prototype.play = function(){
            try { this.playbackRate = rate; } catch(e){}
            return origPlay.apply(this, arguments);
          };
        }
      })();
    </script>`;

    let out = htmlEditado.replace(/<style id="lab-live-tweaks">[\s\S]*?<\/script>\s*/i, '');
    if (out.includes('</head>')) {
      out = out.replace('</head>', `${labCss}\n</head>`);
    } else {
      out = `${labCss}\n${out}`;
    }
    return out;
  }, [htmlEditado, corFundo, mostrarLegenda, mostrarControles, velocidade]);

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(htmlComAjustes || htmlEditado);
      setCopiado(true);
      toast.success('HTML copiado para a área de transferência');
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const baixarHtml = () => {
    if (!selecionada) return;
    const blob = new Blob([htmlComAjustes || htmlEditado], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selecionada.slug}-editado.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo index.html baixado');
  };

  const restaurarOriginal = () => {
    setHtmlEditado(htmlOriginal);
    setMostrarLegenda(false);
    setMostrarControles(true);
    setCorFundo('#09090b');
    setVelocidade(1);
    setPreviewKey((k) => k + 1);
    toast.info('Código restaurado para a versão original do R2');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onVoltar();
              }}
              aria-label="Voltar para o Laboratório"
              className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <h1 className="text-base sm:text-xl font-bold truncate">
                  Estúdio de Edição de Animações
                </h1>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {selecionada
                  ? `${selecionada.tituloHtml || selecionada.titulo} (${selecionada.categoria})`
                  : 'Selecione uma animação para editar e melhorar'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={restaurarOriginal}
              disabled={!htmlOriginal}
              title="Restaurar original"
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar</span>
            </button>
            <button
              type="button"
              onClick={copiarCodigo}
              disabled={!htmlEditado}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 disabled:opacity-40"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              type="button"
              onClick={baixarHtml}
              disabled={!htmlEditado}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar HTML</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Coluna 1: Lista de Animações */}
        <aside className="lg:col-span-3 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar animação..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="max-h-[220px] lg:max-h-[calc(100vh-200px)] overflow-y-auto space-y-1.5 pr-1">
            {filtradas.map((item) => {
              const ativo = selecionada?.slug === item.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setSelecionada(item);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                    ativo
                      ? 'bg-amber-500/15 border-amber-500/50 text-white'
                      : 'bg-zinc-900/50 hover:bg-zinc-900 border-white/5 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {item.categoria}
                    </span>
                    <span className="text-[10px] text-zinc-500">{item.totalAudios} áudios</span>
                  </div>
                  <p className="text-xs font-semibold line-clamp-2 leading-snug">
                    {item.tituloHtml || item.titulo}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Coluna 2: Abas Editor / Ajustes / Áudios + Preview */}
        <section className="lg:col-span-9 space-y-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'preview', label: 'Preview Ao Vivo', icon: Eye },
              { id: 'codigo', label: 'Código HTML / Canvas', icon: Code2 },
              { id: 'ajustes', label: 'Ajustes Rápidos', icon: Sliders },
              { id: 'audios', label: `Áudios R2 (${selecionada?.totalAudios || 0})`, icon: Volume2 },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setTab(t.id as StudioTab);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap border transition-colors ${
                    active
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {carregando ? (
            <div className="h-[520px] rounded-2xl bg-zinc-900/50 border border-white/10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
              <span className="text-xs text-zinc-400">Carregando código da animação...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              {/* Área principal da aba selecionada */}
              {tab !== 'preview' && (
                <div className="xl:col-span-7 rounded-2xl bg-zinc-900/60 border border-white/10 p-4 space-y-3">
                  {tab === 'codigo' && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-zinc-400">
                          {htmlEditado.length.toLocaleString()} caracteres
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewKey((k) => k + 1);
                            toast.success('Preview atualizado com suas edições');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Aplicar no Preview</span>
                        </button>
                      </div>
                      <textarea
                        value={htmlEditado}
                        onChange={(e) => setHtmlEditado(e.target.value)}
                        spellCheck={false}
                        className="w-full h-[540px] p-3 rounded-xl bg-zinc-950 border border-white/10 font-mono text-[11px] leading-relaxed text-zinc-200 focus:outline-none focus:border-amber-500/60 resize-y"
                      />
                    </>
                  )}

                  {tab === 'ajustes' && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Film className="w-4 h-4 text-amber-400" />
                        <span>Ajustes Rápidos no Preview</span>
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/10 cursor-pointer">
                          <span className="text-xs font-semibold">Mostrar Legenda</span>
                          <input
                            type="checkbox"
                            checked={mostrarLegenda}
                            onChange={(e) => {
                              setMostrarLegenda(e.target.checked);
                              setPreviewKey((k) => k + 1);
                            }}
                            className="accent-amber-500 w-4 h-4"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/10 cursor-pointer">
                          <span className="text-xs font-semibold">Mostrar Controles</span>
                          <input
                            type="checkbox"
                            checked={mostrarControles}
                            onChange={(e) => {
                              setMostrarControles(e.target.checked);
                              setPreviewKey((k) => k + 1);
                            }}
                            className="accent-amber-500 w-4 h-4"
                          />
                        </label>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">Velocidade da Narração</span>
                          <span className="text-amber-400 font-mono">{velocidade.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min={0.75}
                          max={1.5}
                          step={0.05}
                          value={velocidade}
                          onChange={(e) => {
                            setVelocidade(parseFloat(e.target.value));
                            setPreviewKey((k) => k + 1);
                          }}
                          className="w-full accent-amber-500"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 space-y-2">
                        <span className="text-xs font-semibold block">Cor de Fundo do Palco</span>
                        <div className="flex items-center gap-2">
                          {['#09090b', '#000000', '#0a1120', '#111827'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setCorFundo(c);
                                setPreviewKey((k) => k + 1);
                              }}
                              style={{ backgroundColor: c }}
                              className={`w-8 h-8 rounded-lg border-2 ${
                                corFundo === c ? 'border-amber-400' : 'border-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === 'audios' && (
                    <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                      <p className="text-xs text-zinc-400">
                        Faixas MP3 hospedadas no Cloudflare R2 usadas por esta animação:
                      </p>
                      {(selecionada?.audiosR2Urls || []).map((url, idx) => (
                        <div
                          key={url}
                          className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span className="font-semibold text-amber-300">Faixa {idx + 1}</span>
                            <span className="truncate max-w-[240px]">{url.split('/').pop()}</span>
                          </div>
                          <audio controls preload="none" src={url} className="w-full h-8" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preview ao Vivo */}
              <div
                className={`${
                  tab === 'preview' ? 'xl:col-span-12 flex justify-center' : 'xl:col-span-5'
                }`}
              >
                <div className="w-full max-w-[420px] mx-auto rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl">
                  <iframe
                    key={`${selecionada?.slug}_${previewKey}`}
                    srcDoc={htmlComAjustes}
                    title={selecionada?.titulo || 'Preview'}
                    allow="autoplay; fullscreen"
                    className="w-full h-[760px] border-0 block bg-zinc-950"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AnimacaoLabStudio;
