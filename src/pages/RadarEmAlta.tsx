import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, ChevronRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchProposicoes } from '@/services/radarService';
import { AuthorAvatar } from '@/components/radar/AuthorAvatar';

function plId(p: any): string | null {
  const id = p.id_externo ?? p.dados_json?.id ?? p.id;
  return id ? String(id) : null;
}

function extractTags(ementa: string | null): string[] {
  if (!ementa) return [];
  const tags: string[] = [];
  const text = ementa.toLowerCase();

  if (text.includes('código penal') || text.includes('decreto-lei nº 2.848') || text.includes('decreto-lei n° 2.848')) tags.push('Código Penal');
  if (text.includes('processo penal') || text.includes('decreto-lei nº 3.689') || text.includes('decreto-lei n° 3.689')) tags.push('Cód. Processo Penal');
  if (text.includes('código civil') || text.includes('lei nº 10.406') || text.includes('lei n° 10.406')) tags.push('Código Civil');
  if (text.includes('processo civil') || text.includes('lei nº 13.105') || text.includes('lei n° 13.105')) tags.push('Cód. Processo Civil');
  if (text.includes('constituição') || text.includes('constituição federal') || text.match(/\bcf\b/)) tags.push('Constituição Federal');
  if (text.includes('consolidação das leis do trabalho') || text.match(/\bclt\b/)) tags.push('CLT');
  if (text.includes('código de defesa do consumidor') || text.includes('lei nº 8.078') || text.includes('lei n° 8.078')) tags.push('CDC');
  if (text.includes('estatuto da criança e do adolescente') || text.includes('lei nº 8.069') || text.includes('lei n° 8.069')) tags.push('ECA');
  if (text.includes('maria da penha') || text.includes('lei nº 11.340') || text.includes('lei n° 11.340')) tags.push('Maria da Penha');
  if (text.includes('lei de drogas') || text.includes('lei nº 11.343') || text.includes('lei n° 11.343')) tags.push('Lei de Drogas');
  if (text.includes('código de trânsito') || text.includes('lei nº 9.503') || text.includes('lei n° 9.503')) tags.push('CTB');
  if (text.includes('estatuto da pessoa idosa') || text.includes('estatuto do idoso') || text.includes('lei nº 10.741')) tags.push('Estatuto da Pessoa Idosa');

  return [...new Set(tags)];
}

function plLabel(p: any): string {
  const sigla = p.sigla_tipo ?? p.dados_json?.siglaTipo ?? 'PL';
  const numero = p.numero ?? p.dados_json?.numero ?? '';
  const ano = p.ano ?? p.dados_json?.ano ?? '';
  return `${sigla} ${numero}/${ano}`.trim();
}

const RadarEmAlta = () => {
  const navigate = useNavigate();
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todos');

  const load = useCallback(async () => {
    setLoading(true);
    // Fetch multiple pages to get a good sample for ranking
    const data1 = await fetchProposicoes(undefined, undefined, 1);
    const data2 = await fetchProposicoes(undefined, undefined, 2);
    const data3 = await fetchProposicoes(undefined, undefined, 3);
    const allData = [...data1, ...data2, ...data3];
    
    // Filter only those that actually alter a known law (have at least one tag)
    const comLeis = allData.filter(p => extractTags(p.ementa ?? p.dados_json?.ementa).length > 0);
    setItens(comLeis);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Compute the ranking of tags
  const ranking = useMemo(() => {
    const counts: Record<string, number> = {};
    itens.forEach(p => {
      const tags = extractTags(p.ementa ?? p.dados_json?.ementa);
      tags.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });

    const sortedTags = Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by frequency desc
      .map(entry => entry[0]);

    return ['Todos', ...sortedTags];
  }, [itens]);

  const filtrados = useMemo(() => {
    if (filtro === 'Todos') {
      // Show all, but sort them by the ranking of their primary tag
      return [...itens].sort((a, b) => {
        const tagsA = extractTags(a.ementa ?? a.dados_json?.ementa);
        const tagsB = extractTags(b.ementa ?? b.dados_json?.ementa);
        const rankA = tagsA.length > 0 ? ranking.indexOf(tagsA[0]) : 999;
        const rankB = tagsB.length > 0 ? ranking.indexOf(tagsB[0]) : 999;
        return rankA - rankB;
      });
    }
    return itens.filter(p => extractTags(p.ementa ?? p.dados_json?.ementa).includes(filtro));
  }, [itens, filtro, ranking]);

  return (
    <div className="space-y-4 pt-4 px-4 pb-[120px] max-w-lg mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground leading-tight">Em Alta</h2>
          <p className="text-[13px] text-muted-foreground">Leis mais alteradas recentemente</p>
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className="flex justify-between w-full gap-2 pb-2">
          {ranking.map(t => (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              className={`flex-1 whitespace-nowrap text-[13px] font-body px-4 py-2 min-h-[40px] rounded-full transition-colors ${
                filtro === t ? 'bg-red-500 text-white font-semibold shadow-md' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >{t}</button>
          ))}
        </div>
      </ScrollArea>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
          <p className="text-sm text-muted-foreground">Analisando impacto nas leis...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma lei em alta no momento.</p>
      ) : (
        <div className="space-y-3">
          {filtrados.map((p, i) => {
            const id = plId(p);
            const tags = extractTags(p.ementa ?? p.dados_json?.ementa);
            
            return (
              <Card
                key={`${id ?? 'x'}-${i}`}
                className="bg-card/50 border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => id && navigate(`/radar/pl/${id}`)}
              >
                <CardContent className="p-3.5 flex items-start gap-3">
                  <AuthorAvatar proposicaoId={id} />
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[13.5px] font-bold text-primary mb-1">{plLabel(p)}</p>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px] px-1.5 py-0 border-red-500/20">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-[13px] text-muted-foreground line-clamp-3 leading-snug">
                      {p.ementa ?? p.dados_json?.ementa ?? 'Sem ementa disponível.'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RadarEmAlta;
