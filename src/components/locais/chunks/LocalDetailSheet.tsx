import React from 'react';
import {
  Bus,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
  Heart,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Star,
} from 'lucide-react';
import wazeLogo from '@/assets/logos/waze.svg';
import uberLogo from '@/assets/logos/uber.svg';
import nnLogo from '@/assets/logos/99.svg';
import gmapsLogo from '@/assets/logos/gmaps.svg';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { iconCategoria, labelCategoria } from '@/lib/locaisCategorias';
import { obterCapaLocal } from '@/lib/locaisCapas';
import {
  googleMapsUrl,
  wazeUrl,
  uberUrl,
  noveNoveUrl,
  streetViewEmbedUrl,
  openInNewTab,
} from '@/lib/deepLinksMapa';
import { LocalSocialSection } from '@/components/locais/LocalSocialSection';
import { copiarTexto } from '@/lib/nativo/copiar';
import { formatKm, type Local } from './locaisConstants';

interface LocalDetailSheetProps {
  selecionado: Local | null;
  onClose: () => void;
  meta: any;
  wikiInfo: { extract: string; url?: string } | null;
  wikiLoading: boolean;
  favoritos: Set<string>;
  onToggleFavorito: (id: string) => void;
  onCompartilhar: (local: Local) => void;
  onAbrirTransporte: () => void;
}

export function LocalDetailSheet({
  selecionado,
  onClose,
  meta,
  wikiInfo,
  wikiLoading,
  favoritos,
  onToggleFavorito,
  onCompartilhar,
  onAbrirTransporte,
}: LocalDetailSheetProps) {
  if (!selecionado) return null;

  const rating = meta?.rating ?? null;
  const totalRatings = meta?.user_ratings_total ?? null;
  const reviews = meta?.reviews ?? [];
  const gmapsUri = meta?.google_maps_uri ?? googleMapsUrl(selecionado);
  const browserKey = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  const embedSrc = browserKey
    ? `https://www.google.com/maps/embed/v1/place?key=${browserKey}&q=${selecionado.lat},${selecionado.lng}&zoom=17`
    : streetViewEmbedUrl(selecionado.lat, selecionado.lng);
  const descricaoBase =
    meta?.editorial_summary ??
    `${labelCategoria(selecionado.categoria)} localizado em ${
      selecionado.cidade ? `${selecionado.cidade}${selecionado.uf ? '/' + selecionado.uf : ''}` : 'sua região'
    }. Confira endereço, contatos e como chegar.`;

  const isFav = favoritos.has(selecionado.id);

  const ActionRow = ({
    icon,
    label,
    descricao,
    onClick,
    variant = 'outline',
  }: {
    icon: React.ReactNode;
    label: string;
    descricao?: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  }) => (
    <button
      onClick={onClick}
      className={
        variant === 'default'
          ? 'w-full min-h-[56px] rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center gap-3 px-4 py-3 active:scale-[0.99] transition'
          : 'w-full min-h-[56px] rounded-2xl border border-border bg-card text-foreground font-semibold flex items-center gap-3 px-4 py-3 active:scale-[0.99] hover:border-primary/40 transition'
      }
    >
      <span className="w-7 h-7 flex items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 text-left min-w-0">
        <span className="block text-[15px] leading-tight">{label}</span>
        {descricao && (
          <span
            className={`block text-[13px] font-normal leading-snug mt-0.5 ${
              variant === 'default' ? 'text-primary-foreground/80' : 'text-muted-foreground'
            }`}
          >
            {descricao}
          </span>
        )}
      </span>
      <ChevronRight className="w-5 h-5 opacity-60 shrink-0" />
    </button>
  );

  const Secao = ({
    titulo,
    acao,
    children,
  }: {
    titulo: string;
    acao?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-[13px] uppercase tracking-[0.12em] font-bold text-foreground/70">{titulo}</h3>
        <div className="flex-1 h-px bg-border" />
        {acao}
      </div>
      {children}
    </section>
  );

  return (
    <Sheet open={!!selecionado} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] sm:h-[90dvh] p-0 flex flex-col bg-background rounded-t-3xl overflow-hidden border-t-0"
      >
        <div className="flex-1 overflow-y-auto">
          {/* Foto com cantos arredondados no topo + botão fechar à esquerda */}
          <div className="relative">
            <div className="relative h-56 sm:h-64 bg-muted overflow-hidden rounded-t-3xl">
              <img
                src={obterCapaLocal(selecionado, meta?.photo_url)}
                alt={selecionado.nome}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-black/20 pointer-events-none" />

              {/* Botão fechar (seta pra baixo) à esquerda */}
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="absolute top-3 left-3 w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border flex items-center justify-center active:scale-95 transition shadow-lg"
              >
                <ChevronDown className="w-5 h-5 text-foreground" />
              </button>

              {/* Badges e ações rápidas dentro da capa */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {typeof rating === 'number' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur text-white text-xs font-semibold">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {rating.toFixed(1)}
                      {totalRatings ? ` · ${totalRatings}` : ''}
                    </span>
                  )}
                  {typeof selecionado.dist_km === 'number' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-black text-xs font-semibold">
                      <Navigation className="w-3 h-3" /> {formatKm(selecionado.dist_km)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleFavorito(selecionado.id)}
                    aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar'}
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur border border-white/20 text-white flex items-center justify-center active:scale-95 transition hover:bg-black/75"
                  >
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </button>
                  <button
                    onClick={() => onCompartilhar(selecionado)}
                    aria-label="Compartilhar"
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur border border-white/20 text-white flex items-center justify-center active:scale-95 transition hover:bg-black/75"
                  >
                    <Share2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cabeçalho */}
          <div className="px-4 pt-5 pb-1 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground mb-1.5">
              {(() => {
                const I = iconCategoria(selecionado.categoria);
                return <I className="w-4 h-4" />;
              })()}
              {labelCategoria(selecionado.categoria)}
            </div>
            <SheetTitle className="text-left text-xl sm:text-2xl leading-tight font-display">
              {selecionado.nome}
            </SheetTitle>
            {(selecionado.endereco || selecionado.cidade) && (
              <div className="flex items-start gap-3 mt-2">
                <MapPin className="w-[18px] h-[18px] text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[15px] leading-snug text-muted-foreground text-left flex-1">
                  {selecionado.endereco || [selecionado.cidade, selecionado.uf].filter(Boolean).join(' / ')}
                  {selecionado.endereco && selecionado.cidade && (
                    <span className="block text-[13px] mt-0.5">
                      {[selecionado.cidade, selecionado.uf].filter(Boolean).join(' / ')}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    const texto = selecionado.endereco
                      ? `${selecionado.nome} — ${selecionado.endereco}`
                      : `${selecionado.nome} — ${[selecionado.cidade, selecionado.uf].filter(Boolean).join(' / ')}`;
                    copiarTexto(texto).then(() => toast.success('Endereço copiado'));
                  }}
                  aria-label="Copiar endereço"
                  className="w-11 h-11 rounded-full border border-border bg-card flex items-center justify-center active:scale-95 transition hover:border-primary/40 shrink-0"
                >
                  <Copy className="w-[18px] h-[18px] text-foreground" />
                </button>
              </div>
            )}
          </div>

          <div className="px-4 pb-10 pt-4 space-y-7 max-w-2xl mx-auto w-full">
            {/* COMO CHEGAR — ação principal primeiro */}
            <Secao titulo="Como chegar">
              <div className="space-y-2.5">
                <ActionRow
                  variant="default"
                  icon={<img src={gmapsLogo} alt="" className="w-6 h-6" />}
                  label="Traçar rota no Google Maps"
                  descricao={
                    typeof selecionado.dist_km === 'number'
                      ? `${formatKm(selecionado.dist_km)} de você · abre o app de mapas`
                      : 'Abre no app de mapas do celular'
                  }
                  onClick={async () => {
                    const { openMap } = await import('@/lib/nativeMapsLauncher');
                    await openMap({
                      lat: selecionado.lat,
                      lng: selecionado.lng,
                      label: selecionado.nome,
                    });
                  }}
                />
                <ActionRow
                  icon={<Bus className="w-6 h-6 text-primary" />}
                  label="Transporte público"
                  descricao="Ônibus, metrô e trem até o local"
                  onClick={onAbrirTransporte}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <ActionRow
                    icon={<img src={wazeLogo} alt="" className="w-6 h-6" />}
                    label="Waze"
                    onClick={() => openInNewTab(wazeUrl(selecionado))}
                  />
                  <ActionRow
                    icon={<img src={uberLogo} alt="" className="w-6 h-6" />}
                    label="Uber"
                    onClick={() => openInNewTab(uberUrl(selecionado))}
                  />
                  <ActionRow
                    icon={<img src={nnLogo} alt="" className="w-6 h-6" />}
                    label="99"
                    onClick={() => openInNewTab(noveNoveUrl(selecionado))}
                  />
                </div>
              </div>
            </Secao>

            {/* MAPA */}
            <Secao
              titulo="No mapa"
              acao={
                <button
                  onClick={() => openInNewTab(gmapsUri)}
                  className="text-[13px] text-primary font-semibold inline-flex items-center gap-1"
                >
                  Ampliar <ExternalLink className="w-3.5 h-3.5" />
                </button>
              }
            >
              <div className="rounded-2xl overflow-hidden border border-border bg-muted">
                <iframe
                  title="Mapa do local"
                  src={embedSrc}
                  className="w-full h-[220px] sm:h-[280px] border-0 block"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </Secao>

            {/* CONTATO E HORÁRIO */}
            {(selecionado.telefone || selecionado.site || selecionado.horario?.raw) && (
              <Secao titulo="Contato e horário">
                <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
                  {selecionado.telefone && (
                    <a
                      href={`tel:${selecionado.telefone}`}
                      className="flex items-center gap-3 px-4 min-h-[56px] py-3"
                    >
                      <Phone className="w-5 h-5 text-primary shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] text-muted-foreground">Telefone</span>
                        <span className="block text-[15px] font-semibold truncate">{selecionado.telefone}</span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </a>
                  )}
                  {selecionado.site && (
                    <a
                      href={selecionado.site.startsWith('http') ? selecionado.site : `https://${selecionado.site}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 min-h-[56px] py-3"
                    >
                      <Globe className="w-5 h-5 text-primary shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] text-muted-foreground">Site oficial</span>
                        <span className="block text-[15px] font-semibold truncate">{selecionado.site}</span>
                      </span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                    </a>
                  )}
                  {selecionado.horario?.raw && (
                    <div className="px-4 py-3.5">
                      <p className="text-[13px] text-muted-foreground mb-1">Horário de funcionamento</p>
                      <p className="text-[15px] leading-relaxed">{selecionado.horario.raw}</p>
                    </div>
                  )}
                </div>
              </Secao>
            )}

            {/* SOBRE */}
            <Secao
              titulo="Sobre este local"
              acao={
                wikiInfo?.url ? (
                  <button
                    onClick={() => openInNewTab(wikiInfo.url!)}
                    className="text-[13px] text-primary font-semibold inline-flex items-center gap-1"
                  >
                    Fonte <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
            >
              <div className="rounded-2xl border border-border bg-card p-4">
                {wikiLoading ? (
                  <div className="flex items-center gap-2 text-[15px] text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Buscando informações…
                  </div>
                ) : (
                  <p className="text-[15px] leading-relaxed text-foreground/90">
                    {wikiInfo?.extract ?? descricaoBase}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/70 text-[13px] font-medium text-foreground/80">
                    {(() => {
                      const I = iconCategoria(selecionado.categoria);
                      return <I className="w-3.5 h-3.5" />;
                    })()}
                    {labelCategoria(selecionado.categoria)}
                  </span>
                  {selecionado.cidade && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/70 text-[13px] font-medium text-foreground/80">
                      <MapPin className="w-3.5 h-3.5" />
                      {[selecionado.cidade, selecionado.uf].filter(Boolean).join(' / ')}
                    </span>
                  )}
                  {typeof rating === 'number' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/70 text-[13px] font-medium text-foreground/80">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      {rating.toFixed(1)}
                      {totalRatings ? ` (${totalRatings})` : ''}
                    </span>
                  )}
                </div>
              </div>
            </Secao>

            {/* COMUNIDADE (Estive aqui + Avaliação + Comentários) */}
            <Secao titulo="Você e a comunidade">
              <LocalSocialSection localId={selecionado.id} />
            </Secao>

            {/* AVALIAÇÕES */}
            <Secao
              titulo={`Avaliações${typeof rating === 'number' ? ` · ${rating.toFixed(1)}★` : ''}`}
              acao={
                meta?.google_maps_uri ? (
                  <button
                    onClick={() => openInNewTab(meta.google_maps_uri!)}
                    className="text-[13px] text-primary font-semibold inline-flex items-center gap-1"
                  >
                    Ver todas <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
            >
              {reviews && reviews.length > 0 ? (
                <div className="space-y-2.5">
                  {reviews.slice(0, 3).map((r: any, idx: number) => {
                    const author = r.authorAttribution?.displayName ?? 'Anônimo';
                    const texto = r.text?.text ?? r.originalText?.text ?? '';
                    return (
                      <div key={idx} className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[15px] font-semibold text-foreground truncate flex-1">{author}</p>
                          {typeof r.rating === 'number' && (
                            <span className="inline-flex items-center gap-1 text-[13px] font-semibold">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              {r.rating}
                            </span>
                          )}
                        </div>
                        {r.relativePublishTimeDescription && (
                          <p className="text-[13px] text-muted-foreground mb-1.5">
                            {r.relativePublishTimeDescription}
                          </p>
                        )}
                        {texto && (
                          <p className="text-[15px] text-foreground/85 leading-relaxed line-clamp-5">{texto}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[15px] text-muted-foreground">
                  Ainda não há avaliações disponíveis para este local.
                </p>
              )}
            </Secao>

            {meta?.photo_attribution && (
              <p className="text-[12px] text-muted-foreground text-center">Foto: {meta.photo_attribution}</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
