import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ExternalLink, WifiOff, User, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { fetchProposicaoDetalhe, fetchProposicaoTramitacoes, fetchProposicaoAutores, fetchDeputadoDetalhe, extractTags } from '@/services/radarService';
import { supabase } from '@/integrations/supabase/client';
import { isOffline } from '@/lib/offlineFeatures';
import { useGoBack } from '@/hooks/useGoBack';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

function AuthorInfo({ proposicaoId }: { proposicaoId: string }) {
  const [deputado, setDeputado] = useState<any | null>(null);
  const [nomeAutor, setNomeAutor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchProposicaoAutores(proposicaoId).then(async (autores) => {
      if (!isMounted) return;
      if (autores && autores.length > 0) {
        setNomeAutor(autores[0].nome);
        if (autores[0].uri) {
          const match = autores[0].uri.match(/\/deputados\/(\d+)/);
          if (match && match[1]) {
            const dep = await fetchDeputadoDetalhe(Number(match[1]));
            if (isMounted && dep) {
              setDeputado(dep);
            }
          }
        }
      }
      if (isMounted) setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [proposicaoId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 animate-pulse mb-4">
        <div className="w-12 h-12 rounded-full bg-muted/50" />
        <div className="space-y-2">
          <div className="w-32 h-3 bg-muted/50 rounded" />
          <div className="w-20 h-3 bg-muted/50 rounded" />
        </div>
      </div>
    );
  }

  if (!nomeAutor) return null;

  const foto = deputado?.ultimoStatus?.urlFoto || null;
  const partido = deputado?.ultimoStatus?.siglaPartido || 'Sem partido';
  const uf = deputado?.ultimoStatus?.siglaUf || '';

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-muted overflow-hidden shrink-0 border border-border flex items-center justify-center">
        {foto ? (
          <img src={foto} alt={nomeAutor} className="w-full h-full object-cover" />
        ) : (
          <User className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="text-[14px] font-bold text-foreground leading-snug">{nomeAutor}</p>
        <p className="text-[12px] text-muted-foreground font-medium">
          {partido}{uf ? ` - ${uf}` : ''}
        </p>
      </div>
    </div>
  );
}

function EmentaExplicacao({ detalhe }: { detalhe: any }) {
  const [explicacao, setExplicacao] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const gerar = async () => {
    setLoading(true);
    try {
      const texto = `Proposição: ${detalhe.siglaTipo} ${detalhe.numero}/${detalhe.ano}\nEmenta: ${detalhe.ementa}\nEmenta detalhada: ${detalhe.ementaDetalhada || ''}`;
      
      const { data, error } = await supabase.functions.invoke('assistente-juridica', {
        body: { 
          mode: 'analise_pl',
          ementa: texto,
        },
      });

      if (error) throw error;
      if (!data?.reply) throw new Error('Sem resposta da IA');
      
      setExplicacao(data.reply);
      toast.success('Explicação gerada com sucesso!');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao gerar explicação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4 space-y-4">
        <Tabs defaultValue="original" className="w-full">
          <TabsList className="bg-secondary/60 rounded-xl h-11 grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="original" className="rounded-lg text-[13px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Ementa</TabsTrigger>
            <TabsTrigger value="explicacao" className="rounded-lg text-[13px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Explicação</TabsTrigger>
          </TabsList>

          <TabsContent value="original" className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Ementa Original</p>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {detalhe.ementa || 'Sem ementa disponível.'}
            </p>
            {detalhe.ementaDetalhada && (
              <p className="text-[13px] leading-relaxed text-muted-foreground/80">{detalhe.ementaDetalhada}</p>
            )}
          </TabsContent>

          <TabsContent value="explicacao">
            {explicacao ? (
              <div className="prose prose-sm dark:prose-invert max-w-none font-body text-sm [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:text-foreground text-muted-foreground">
                <ReactMarkdown>{explicacao}</ReactMarkdown>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground font-body max-w-[250px]">
                  Lendo o projeto e simplificando o texto para você...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-body max-w-[280px]">
                  Entenda o que este projeto de lei significa na prática.
                </p>
                <button
                  onClick={gerar}
                  className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-sm font-semibold shadow-md active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Gerar Explicação
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function RadarPLDetalhe() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();

  const [detalhe, setDetalhe] = useState<any | null>(null);
  const [tramitacoes, setTramitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      if (isOffline()) {
        setOffline(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      const [d, t] = await Promise.all([
        fetchProposicaoDetalhe(id),
        fetchProposicaoTramitacoes(id),
      ]);
      if (!ativo) return;
      setDetalhe(d);
      setTramitacoes(Array.isArray(t) ? [...t].reverse() : []);
      setLoading(false);
    })();
    return () => { ativo = false; };
  }, [id]);

  const titulo = detalhe
    ? `${detalhe.siglaTipo ?? 'PL'} ${detalhe.numero ?? ''}/${detalhe.ano ?? ''}`.trim()
    : 'Projeto de Lei';
  
  const tags = detalhe ? extractTags(detalhe.ementa) : [];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md">
        <PageHeader title={titulo} subtitle="Radar Legislativo" onBack={() => goBack()} />
      </div>

      <main className="p-4 max-w-3xl mx-auto pb-24 space-y-4 lg:max-w-[1100px] lg:px-10 lg:pb-12">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && offline && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <WifiOff className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-xs">
              O Radar Legislativo só funciona com internet. Reconecte para ver este projeto.
            </p>
          </div>
        )}

        {!loading && !offline && !detalhe && (
          <p className="text-sm text-muted-foreground text-center py-16">Projeto não encontrado.</p>
        )}

        {detalhe && (
          <>
            <AuthorInfo proposicaoId={id} />
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-[11px] px-2 py-0.5">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <EmentaExplicacao detalhe={detalhe} />

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Situação</p>
                {[
                  ['Status', detalhe.statusProposicao?.descricaoSituacao],
                  ['Tramitação', detalhe.statusProposicao?.descricaoTramitacao],
                  ['Órgão', detalhe.statusProposicao?.siglaOrgao],
                  ['Apresentação', detalhe.dataApresentacao?.slice(0, 10)],
                  ['Última atualização', detalhe.statusProposicao?.dataHora?.slice(0, 10)],
                ]
                  .filter(([, v]) => !!v)
                  .map(([label, value]) => (
                    <div key={String(label)} className="flex gap-3 text-[13px]">
                      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
                      <span className="text-foreground flex-1">{String(value)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {tramitacoes.length > 0 && (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
                    Histórico de tramitação
                  </p>
                  <div className="relative pl-5 border-l-2 border-primary/25 space-y-4">
                    {tramitacoes.slice(0, 40).map((t: any, i: number) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-primary/15" />
                        <p className="text-[11px] font-bold text-primary">
                          {t.dataHora?.slice(0, 10)} · {t.siglaOrgao}
                        </p>
                        <p className="text-[13px] text-foreground">{t.descricaoTramitacao}</p>
                        {t.despacho && (
                          <p className="text-[12.5px] text-muted-foreground leading-snug mt-0.5">{t.despacho}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {detalhe.urlInteiroTeor && (
              <a
                href={detalhe.urlInteiroTeor}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-[15px] active:scale-[0.99] transition-transform"
              >
                <ExternalLink className="w-4 h-4" />
                Ver inteiro teor
              </a>
            )}
          </>
        )}
      </main>
    </div>
  );
}
