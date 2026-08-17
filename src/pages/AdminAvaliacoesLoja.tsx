import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, Search, Smartphone, Clock, MessageSquare, AlertTriangle, 
  ThumbsUp, CheckCircle2, MessageCircle, RotateCcw, Loader2 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminAvaliacoesLoja() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Busca os reviews do Supabase
  const { data: reviews, isLoading, refetch } = useQuery({
    queryKey: ['play_reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('play_reviews')
        .select('*')
        .order('last_modified_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar reviews:', error);
        throw error;
      }
      return data || [];
    }
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('play-reviews-sync', {
        headers: {
          // Token provisrio se houver config extra, a Edge Function nǜo recusa
          // auth mas espera parametro token ou bearer. O client jǭ envia o Auth do user.
        }
      });
      if (error) throw error;
      toast.success(data?.message || 'Avaliações sincronizadas com sucesso!');
      refetch();
    } catch (err: any) {
      toast.error('Erro na sincronização: ' + (err.message || 'Verifique as credenciais da Play Store.'));
    } finally {
      setIsSyncing(false);
    }
  };

  const safeReviews = reviews || [];
  const totalReviews = safeReviews.length;
  const averageRating = totalReviews > 0 
    ? (safeReviews.reduce((acc, r) => acc + r.star_rating, 0) / totalReviews).toFixed(1) 
    : '0.0';

  const badReviews = safeReviews.filter(r => r.star_rating <= 3).length;

  // Filtragem local
  const filteredList = safeReviews.filter(r => {
    if (filterRating && r.star_rating !== filterRating) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      if (!r.comment?.toLowerCase().includes(lower) && !r.author_name?.toLowerCase().includes(lower)) {
        return false;
      }
    }
    return true;
  });

  const formatDate = (iso: string | null) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-yellow-500 text-yellow-500' : 'fill-muted/20 text-muted/20'}`} />
    ));
  };

  return (
    <div className="min-h-dvh bg-background pb-8 flex flex-col">
      <PageHeader title="Avaliações da Play Store" onBack={() => navigate('/admin')} />

      <div className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
             <h2 className="text-xl font-display font-bold">Feedback dos Usuários</h2>
             <p className="text-sm text-muted-foreground">Monitoramento de reviews do Google Play</p>
           </div>
           <Button onClick={handleSync} disabled={isSyncing} className="gap-2 shrink-0">
             {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
             Sincronizar Agora
           </Button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-secondary/30 border-border/60 flex items-center justify-between">
            <div>
              <div className="text-sm font-body text-muted-foreground">Avaliação Média</div>
              <div className="text-3xl font-display font-bold flex items-center gap-2 mt-1">
                {averageRating} <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-secondary/30 border-border/60 flex items-center justify-between">
            <div>
              <div className="text-sm font-body text-muted-foreground">Total de Reviews (Lidas)</div>
              <div className="text-3xl font-display font-bold mt-1">
                {totalReviews}
              </div>
            </div>
            <MessageSquare className="w-8 h-8 text-primary/30" />
          </Card>

          <Card className="p-4 bg-red-500/5 border-red-500/20 flex items-center justify-between">
            <div>
              <div className="text-sm font-body text-red-400">Atenção Crítica (1 a 3 estrelas)</div>
              <div className="text-3xl font-display font-bold mt-1 text-red-500">
                {badReviews}
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500/30" />
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <Input 
               placeholder="Buscar por comentário ou nome..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9 bg-secondary/30 border-border/60" 
             />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
             <Button variant={filterRating === null ? "default" : "outline"} size="sm" onClick={() => setFilterRating(null)}>Todas</Button>
             <Button variant={filterRating === 5 ? "default" : "outline"} size="sm" onClick={() => setFilterRating(5)} className="gap-1.5"><Star className="w-3.5 h-3.5" /> 5</Button>
             <Button variant={filterRating === 1 ? "default" : "outline"} size="sm" onClick={() => setFilterRating(1)} className="gap-1.5"><Star className="w-3.5 h-3.5" /> 1</Button>
          </div>
        </div>

        {/* Lista de Reviews */}
        <div className="space-y-4">
          {isLoading ? (
             <div className="text-center p-8 text-muted-foreground flex flex-col items-center gap-2">
               <Loader2 className="w-6 h-6 animate-spin" />
               Carregando avaliações...
             </div>
          ) : filteredList.length === 0 ? (
             <div className="text-center p-8 text-muted-foreground bg-secondary/20 rounded-xl border border-border/50">
               Nenhuma avaliação encontrada para os filtros aplicados.
               <br/> (Se for a primeira vez, clique em "Sincronizar Agora" após criar a tabela SQL)
             </div>
          ) : (
            filteredList.map((review) => (
              <Card key={review.review_id} className="overflow-hidden border-border/60 bg-secondary/10">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 uppercase font-bold text-primary">
                        {review.author_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{review.author_name || 'Usuário Google'}</div>
                        <div className="flex gap-1 mt-1">
                          {renderStars(review.star_rating)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{formatDate(review.last_modified_at)}</div>
                      <Badge variant="outline" className="mt-1 text-[10px] bg-background/50">
                         {review.app_version_name ? `v${review.app_version_name}` : 'App v?'}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed mt-2 pl-1 border-l-2 border-primary/20">
                    {review.comment || <span className="italic text-muted-foreground">Avaliação sem texto</span>}
                  </p>

                  {/* Metadados: Aparelho etc */}
                  <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
                     {review.device && (
                       <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> {review.device}</span>
                     )}
                     {review.reviewer_language && (
                       <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Idioma: {review.reviewer_language}</span>
                     )}
                  </div>
                </div>

                {/* Resposta do Desenvolvedor (se houver) */}
                {review.reply_text && (
                  <div className="bg-primary/5 p-4 border-t border-primary/10">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resposta da Equipe ({formatDate(review.reply_last_modified_at)})
                    </div>
                    <p className="text-sm text-foreground/80 pl-5 border-l-2 border-primary/30 ml-1">
                      {review.reply_text}
                    </p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
