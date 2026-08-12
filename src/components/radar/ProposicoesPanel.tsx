import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchProposicoes } from '@/services/radarService';

interface Props {
  searchQuery?: string;
  dataInicial?: string;
}

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

  // Retorna apenas tags únicas
  return [...new Set(tags)];
}

function plLabel(p: any): string {
  const sigla = p.sigla_tipo ?? p.dados_json?.siglaTipo ?? 'PL';
  const numero = p.numero ?? p.dados_json?.numero ?? '';
  const ano = p.ano ?? p.dados_json?.ano ?? '';
  return `${sigla} ${numero}/${ano}`.trim();
}

const ProposicoesPanel = ({ searchQuery = '', dataInicial }: Props) => {
  const navigate = useNavigate();
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState(searchQuery);

  const load = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    const data = await fetchProposicoes(undefined, undefined, p);
    setItens((prev) => (append ? [...prev, ...data] : data));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(1, false);
    setPagina(1);
  }, [load, dataInicial]);

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? itens.filter(
        (p) =>
          String(p.ementa ?? p.dados_json?.ementa ?? '').toLowerCase().includes(termo) ||
          plLabel(p).toLowerCase().includes(termo),
      )
    : itens;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por número ou ementa"
          className="pl-9 h-11 text-[15px]"
        />
      </div>

      {loading && itens.length === 0 ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 2xl:grid-cols-3">
          {filtrados.map((p, i) => {
            const id = plId(p);
            return (
              <Card
                key={`${id ?? 'x'}-${i}`}
                className="bg-card/50 border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => id && navigate(`/radar/pl/${id}`)}
              >
                <CardContent className="p-3.5 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-primary mb-1">{plLabel(p)}</p>
                    {extractTags(p.ementa ?? p.dados_json?.ementa).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {extractTags(p.ementa ?? p.dados_json?.ementa).map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-1.5 py-0">
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

          {filtrados.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 lg:col-span-full">Nenhuma proposição encontrada.</p>
          )}

          {!termo && itens.length > 0 && (
            <Button
              variant="outline"
              className="w-full lg:col-span-full"
              disabled={loading}
              onClick={() => {
                const next = pagina + 1;
                setPagina(next);
                void load(next, true);
              }}
            >
              {loading ? 'Carregando…' : 'Carregar mais'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProposicoesPanel;
