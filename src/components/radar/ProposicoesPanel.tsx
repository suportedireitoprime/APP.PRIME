import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchProposicoes } from '@/services/radarService';
import { AuthorAvatar } from './AuthorAvatar';

const TIPO_FILTERS = ['TODOS', 'PL', 'PEC', 'PLP'];

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

  // Regex para extrair referências a leis genéricas (ex: Lei nº 12.345, Lei Complementar n° 123)
  // Ignora leis famosas já capturadas para evitar duplicatas, mas o Set abaixo já ajuda
  const leiMatch = text.match(/lei (?:complementar )?n[º°]\s*([\d.]+)/gi);
  if (leiMatch) {
    leiMatch.forEach(m => {
      // Normalizar para "Lei nº X.XXX"
      const num = m.match(/n[º°]\s*([\d.]+)/i)?.[1];
      const isComp = m.toLowerCase().includes('complementar');
      if (num) {
        tags.push(`${isComp ? 'Lei Complementar' : 'Lei'} nº ${num}`);
      }
    });
  }

  // Retorna apenas tags únicas, filtrando possíveis duplicatas semânticas
  // (ex: "Código Penal" e "Lei nº 2.848")
  const uniqueTags = [...new Set(tags)];
  const tagsFinais = uniqueTags.filter(t => {
    // Filtros de exclusão mútua se a tag "famosa" já estiver lá
    if (t === 'Lei nº 2.848' && uniqueTags.includes('Código Penal')) return false;
    if (t === 'Lei nº 3.689' && uniqueTags.includes('Cód. Processo Penal')) return false;
    if (t === 'Lei nº 10.406' && uniqueTags.includes('Código Civil')) return false;
    if (t === 'Lei nº 13.105' && uniqueTags.includes('Cód. Processo Civil')) return false;
    if (t === 'Lei nº 8.078' && uniqueTags.includes('CDC')) return false;
    if (t === 'Lei nº 8.069' && uniqueTags.includes('ECA')) return false;
    if (t === 'Lei nº 11.340' && uniqueTags.includes('Maria da Penha')) return false;
    if (t === 'Lei nº 11.343' && uniqueTags.includes('Lei de Drogas')) return false;
    if (t === 'Lei nº 9.503' && uniqueTags.includes('CTB')) return false;
    if (t === 'Lei nº 10.741' && uniqueTags.includes('Estatuto da Pessoa Idosa')) return false;
    return true;
  });

  return tagsFinais;
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
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');

  const load = useCallback(async (p: number, append: boolean, tipo: string, dt: string | undefined) => {
    setLoading(true);
    const tipoVal = tipo === 'TODOS' ? undefined : tipo;
    const data = await fetchProposicoes(tipoVal, undefined, p, dt, dt);
    setItens((prev) => (append ? [...prev, ...data] : data));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(1, false, tipoFiltro, dataInicial);
    setPagina(1);
  }, [load, dataInicial, tipoFiltro]);

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? itens.filter(
        (p) =>
          String(p.ementa ?? p.dados_json?.ementa ?? '').toLowerCase().includes(termo) ||
          plLabel(p).toLowerCase().includes(termo),
      )
    : itens;

  return (
    <div className="space-y-4">
      <ScrollArea className="w-full">
        <div className="flex justify-between w-full gap-1.5 pb-2">
          {TIPO_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className={`flex-1 whitespace-nowrap text-[14px] font-body px-2 py-2 min-h-[44px] rounded-full transition-colors ${
                tipoFiltro === t ? 'bg-primary text-primary-foreground font-semibold shadow-md' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >{t === 'TODOS' ? 'Todos' : t}</button>
          ))}
        </div>
      </ScrollArea>

      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por número ou ementa"
          className="w-full pl-11 h-12 text-[16px] rounded-xl bg-card border-border/50 shadow-sm"
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
                  <AuthorAvatar proposicaoId={id} />
                  <div className="flex-1 min-w-0 pt-0.5">
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
                void load(next, true, tipoFiltro, dataInicial);
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
