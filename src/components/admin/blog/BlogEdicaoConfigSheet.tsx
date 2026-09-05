import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sparkles,
  Play,
  Image as ImageIcon,
  Zap,
  CalendarClock,
  PenLine,
  ImagePlus,
  Headphones,
  Bell,
  ChevronRight,
  Loader2,
  Wand2,
  Pause,
} from 'lucide-react';
import { Config, Tema, Voz } from './blogEdicaoTypes';

export type ConfigSectionType = 'acoes' | 'agenda' | 'conteudo' | 'capa' | 'narracao' | 'push' | null;

interface BlogEdicaoConfigSheetProps {
  configOpen: boolean;
  setConfigOpen: (open: boolean) => void;
  config: Config | null;
  setConfig: React.Dispatch<React.SetStateAction<Config | null>>;
  configSection: ConfigSectionType;
  setConfigSection: (s: ConfigSectionType) => void;
  running: boolean;
  gerarTemas: () => Promise<void>;
  rodarAgora: () => Promise<void>;
  regerarUltimasCapas: (qtd?: number) => Promise<void>;
  bibliotecaCount: number;
  filaHojeCount: number;
  concluidosCount: number;
  salvarConfig: () => Promise<void>;
  previewTexto: string;
  setPreviewTexto: (text: string) => void;
  estimativa: {
    chars: number;
    durationMin: number;
    custoBRL: number;
    custoUSD: number;
  };
  vozes: Voz[];
  previewGerando: string | null;
  gerarPreview: (voz: string) => Promise<void>;
  previewAudio: Record<string, string>;
  cacheKey: (voz: string) => string;
  playingUrl: string | null;
  togglePlay: (url: string) => void;
}

export function BlogEdicaoConfigSheet({
  configOpen,
  setConfigOpen,
  config,
  setConfig,
  configSection,
  setConfigSection,
  running,
  gerarTemas,
  rodarAgora,
  regerarUltimasCapas,
  bibliotecaCount,
  filaHojeCount,
  concluidosCount,
  salvarConfig,
  previewTexto,
  setPreviewTexto,
  estimativa,
  vozes,
  previewGerando,
  gerarPreview,
  previewAudio,
  cacheKey,
  playingUrl,
  togglePlay,
}: BlogEdicaoConfigSheetProps) {
  return (
    <>
      <Sheet open={configOpen} onOpenChange={setConfigOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Configurações</SheetTitle>
            <p className="text-xs text-muted-foreground text-left">Ações e ajustes de publicação.</p>
          </SheetHeader>
          {config && (
            <div className="pt-4 pb-8 space-y-2">
              <button
                onClick={() => setConfigSection('acoes')}
                className="w-full flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/40 p-3 hover:from-primary/30 transition text-left"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20 text-primary">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">Ações rápidas</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Gerar temas · Gerar próximo artigo
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {(
                [
                  {
                    id: 'agenda',
                    icon: CalendarClock,
                    tint: 'text-blue-300 bg-blue-500/10',
                    title: 'Agenda e publicação',
                    desc: `${config.posts_por_dia} posts/dia · ${(config.horarios || []).join(', ')}`,
                  },
                  {
                    id: 'conteudo',
                    icon: PenLine,
                    tint: 'text-emerald-300 bg-emerald-500/10',
                    title: 'Conteúdo',
                    desc: `${config.tamanho_alvo} palavras · tom personalizado`,
                  },
                  {
                    id: 'capa',
                    icon: ImagePlus,
                    tint: 'text-amber-300 bg-amber-500/10',
                    title: 'Capa dos artigos',
                    desc: 'Prompt padrão para geração de imagem',
                  },
                  {
                    id: 'narracao',
                    icon: Headphones,
                    tint: 'text-fuchsia-300 bg-fuchsia-500/10',
                    title: 'Narração',
                    desc: `Voz padrão: ${config.narracao_voz || '—'}`,
                  },
                  {
                    id: 'push',
                    icon: Bell,
                    tint: 'text-rose-300 bg-rose-500/10',
                    title: 'Notificação push',
                    desc: config.push_ativo ? 'Ativa' : 'Desativada',
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setConfigSection(item.id)}
                    className="w-full flex items-center gap-3 rounded-xl bg-secondary/40 border border-border/50 p-3 hover:bg-secondary/60 transition text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.tint}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{item.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!configSection} onOpenChange={(o) => !o && setConfigSection(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          {config && configSection === 'acoes' && (
            <>
              <DialogHeader>
                <DialogTitle>Ações rápidas</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Use estas ações para popular a biblioteca de temas ou disparar imediatamente o próximo artigo
                  agendado.
                </p>
                <button
                  onClick={gerarTemas}
                  disabled={running}
                  className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" /> Gerar 30 temas com IA
                </button>
                <button
                  onClick={rodarAgora}
                  disabled={running}
                  className="w-full rounded-xl bg-secondary font-semibold py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" /> Gerar próximo artigo agora
                </button>
                <button
                  onClick={() => regerarUltimasCapas(3)}
                  disabled={running}
                  className="w-full rounded-xl bg-amber-500/15 text-amber-300 font-semibold py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4" /> Refazer as 3 últimas capas
                </button>

                <div className="text-[11px] text-muted-foreground rounded-lg bg-secondary/40 p-2">
                  <strong className="text-foreground">Biblioteca:</strong> {bibliotecaCount} temas ·{' '}
                  <strong className="text-foreground">Fila de hoje:</strong> {filaHojeCount} ·{' '}
                  <strong className="text-foreground">Publicados:</strong> {concluidosCount}
                </div>
              </div>
            </>
          )}

          {config && configSection === 'agenda' && (
            <>
              <DialogHeader>
                <DialogTitle>Agenda e publicação</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Posts por dia</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={config.posts_por_dia}
                    onChange={(e) => setConfig({ ...config, posts_por_dia: Number(e.target.value) })}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Horários (HH:MM separados por vírgula)</span>
                  <input
                    type="text"
                    value={(config.horarios || []).join(', ')}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        horarios: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm font-mono"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Intervalo (min, opcional — sobrescreve horários)</span>
                  <input
                    type="number"
                    min={0}
                    value={config.intervalo_minutos ?? ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        intervalo_minutos: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Modo</span>
                  <select
                    value={config.modo_publicacao}
                    onChange={(e) =>
                      setConfig({ ...config, modo_publicacao: e.target.value as 'auto' | 'rascunho' })
                    }
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
                  >
                    <option value="auto">Publicar automaticamente</option>
                    <option value="rascunho">Salvar como rascunho</option>
                  </select>
                </label>
              </div>
            </>
          )}

          {config && configSection === 'conteudo' && (
            <>
              <DialogHeader>
                <DialogTitle>Conteúdo</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Tom da escrita</span>
                  <textarea
                    value={config.tom}
                    rows={3}
                    onChange={(e) => setConfig({ ...config, tom: e.target.value })}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Tamanho-alvo (palavras)</span>
                  <input
                    type="number"
                    min={500}
                    max={4000}
                    value={config.tamanho_alvo}
                    onChange={(e) => setConfig({ ...config, tamanho_alvo: Number(e.target.value) })}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </>
          )}

          {config && configSection === 'capa' && (
            <>
              <DialogHeader>
                <DialogTitle>Capa dos artigos</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Prompt padrão da capa</span>
                  <textarea
                    value={config.estilo_capa_prompt}
                    rows={10}
                    onChange={(e) => setConfig({ ...config, estilo_capa_prompt: e.target.value })}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-xs font-mono"
                  />
                </label>
              </div>
            </>
          )}

          {config && configSection === 'narracao' && (
            <>
              <DialogHeader>
                <DialogTitle>Narração dos artigos</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ouça uma prévia de cada voz e escolha a padrão. O trecho abaixo é usado como amostra.
                </p>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Estilo (prompt de narração)</span>
                  <textarea
                    value={config.narracao_estilo || ''}
                    rows={3}
                    onChange={(e) => setConfig({ ...config, narracao_estilo: e.target.value })}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-xs"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Trecho de amostra</span>
                  <textarea
                    value={previewTexto}
                    rows={3}
                    maxLength={1500}
                    onChange={(e) => setPreviewTexto(e.target.value)}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">{previewTexto.length}/1500</span>
                </label>
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary/40 p-2">
                  <div className="text-center">
                    <div className="text-[10px] uppercase text-muted-foreground">Duração</div>
                    <div className="text-sm font-bold text-fuchsia-200">~{estimativa.durationMin} min</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] uppercase text-muted-foreground">Caracteres</div>
                    <div className="text-sm font-bold text-fuchsia-200">
                      ~{estimativa.chars.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] uppercase text-muted-foreground">Custo</div>
                    <div className="text-sm font-bold text-fuchsia-200">
                      ~R${' '}
                      {estimativa.custoBRL.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[9px] text-muted-foreground/70">Gemini 2.5 Flash TTS</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Voz padrão: <strong className="text-fuchsia-200">{config.narracao_voz || '—'}</strong>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                  {vozes.map((v) => {
                    const selecionada = config.narracao_voz === v.id;
                    const gerando = previewGerando === v.id;
                    const audioUrl = previewAudio[cacheKey(v.id)];
                    return (
                      <div
                        key={v.id}
                        className={`rounded-lg border p-2 flex items-center gap-2 ${
                          selecionada
                            ? 'bg-fuchsia-500/15 border-fuchsia-400/60'
                            : 'bg-secondary/40 border-border/50'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            v.genero === 'F'
                              ? 'bg-pink-500/20 text-pink-200'
                              : 'bg-blue-500/20 text-blue-200'
                          }`}
                        >
                          {v.genero}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{v.id}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{v.descricao}</div>
                        </div>
                        <button
                          onClick={() => gerarPreview(v.id)}
                          disabled={gerando}
                          className="p-2 rounded-lg bg-fuchsia-500/20 text-fuchsia-200 hover:bg-fuchsia-500/30 disabled:opacity-50"
                          title="Gerar preview"
                        >
                          {gerando ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {audioUrl && (
                          <button
                            onClick={() => togglePlay(audioUrl)}
                            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
                            title="Reproduzir"
                          >
                            {playingUrl === audioUrl ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setConfig({ ...config, narracao_voz: v.id })}
                          className={`text-[10px] font-bold px-2 py-1.5 rounded-lg ${
                            selecionada
                              ? 'bg-fuchsia-400 text-fuchsia-950'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {selecionada ? 'PADRÃO' : 'ESCOLHER'}
                        </button>
                      </div>
                    );
                  })}
                  {vozes.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">Carregando vozes…</div>
                  )}
                </div>
              </div>
            </>
          )}

          {config && configSection === 'push' && (
            <>
              <DialogHeader>
                <DialogTitle>Notificação push</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                  <span className="text-sm font-semibold">Ativar notificações</span>
                  <input
                    type="checkbox"
                    checked={config.push_ativo}
                    onChange={(e) => setConfig({ ...config, push_ativo: e.target.checked })}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Título (use {'{titulo}'} e {'{headline}'})</span>
                  <input
                    type="text"
                    value={config.push_titulo_template}
                    onChange={(e) => setConfig({ ...config, push_titulo_template: e.target.value })}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Corpo</span>
                  <input
                    type="text"
                    value={config.push_corpo_template}
                    onChange={(e) => setConfig({ ...config, push_corpo_template: e.target.value })}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Silêncio início</span>
                    <input
                      type="time"
                      value={config.push_quiet_start || ''}
                      onChange={(e) => setConfig({ ...config, push_quiet_start: e.target.value || null })}
                      className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Silêncio fim</span>
                    <input
                      type="time"
                      value={config.push_quiet_end || ''}
                      onChange={(e) => setConfig({ ...config, push_quiet_end: e.target.value || null })}
                      className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Audiência (JSON)</span>
                  <textarea
                    rows={3}
                    value={JSON.stringify(config.push_audiencia, null, 2)}
                    onChange={(e) => {
                      try {
                        setConfig({ ...config, push_audiencia: JSON.parse(e.target.value) });
                      } catch {
                        /* ignora */
                      }
                    }}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-xs font-mono"
                  />
                </label>
              </div>
            </>
          )}

          {config && configSection && configSection !== 'acoes' && (
            <div className="flex gap-2 pt-4 sticky bottom-0 bg-background">
              <button
                onClick={() => setConfigSection(null)}
                className="flex-1 rounded-xl bg-secondary font-semibold py-2.5 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await salvarConfig();
                  setConfigSection(null);
                  setConfigOpen(true);
                }}
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm"
              >
                Salvar
              </button>
            </div>
          )}
          {config && configSection === 'acoes' && (
            <div className="flex gap-2 pt-4 sticky bottom-0 bg-background">
              <button
                onClick={() => setConfigSection(null)}
                className="flex-1 rounded-xl bg-secondary font-semibold py-2.5 text-sm"
              >
                Fechar
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
