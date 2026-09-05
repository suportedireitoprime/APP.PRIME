import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

type AudienceFilter = 'all' | 'premium' | 'free';

type EventRow = {
  event_name: string;
  metadata?: any;
  user_id: string;
};

// Map event names to human readable categories
const CATEGORY_MAP: Record<string, string> = {
  'biblioteca': 'Biblioteca Jurídica',
  'aprender': 'Módulo Aprender',
  'legislacao': 'Vade Mecum / Legislação',
  'vade_mecum': 'Vade Mecum / Legislação',
  'ferramenta': 'Ferramentas do App',
  'me_explique': 'Chat Jurídico (Me Explique)',
  'jurisprudencia': 'Jurisprudência',
  'radar': 'Radar Legislativo',
  'descoberta': 'Lembretes e Descoberta',
  'questao': 'Resolução de Questões',
  'noticia': 'Notícias',
};

function getCategory(eventName: string): string {
  for (const [key, label] of Object.entries(CATEGORY_MAP)) {
    if (eventName.startsWith(key)) return label;
  }
  return 'Outros';
}

function getSubfunctionLabel(ev: EventRow): string {
  const { event_name, metadata } = ev;
  if (event_name === 'ferramenta_abrir' && metadata) {
    return `Abrir: ${metadata.ferramenta || metadata.nome || metadata.id || 'desconhecida'}`;
  }
  if (event_name === 'vade_mecum_abrir_lei' && metadata) {
    return `Abrir Lei: ${metadata.lei_nome || 'desconhecida'}`;
  }
  if (event_name === 'biblioteca_abrir_livro' && metadata) {
    return `Abrir Livro: ${metadata.livro_nome || 'desconhecido'}`;
  }
  return event_name;
}

export default function AdminRankingFuncoes() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AudienceFilter>('all');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [premiumIds, setPremiumIds] = useState<Set<string>>(new Set());
  const [freeIds, setFreeIds] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profiles to know premium status
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, is_premium, is_admin')
        .eq('is_admin', false);
      
      if (profError) throw profError;
      
      const pIds = new Set<string>();
      const fIds = new Set<string>();
      
      (profiles || []).forEach(p => {
        if (p.is_premium) pIds.add(p.id);
        else fIds.add(p.id);
      });
      
      setPremiumIds(pIds);
      setFreeIds(fIds);

      // Fetch sample of recent events (using a limit to prevent memory exhaustion, representing "current" access)
      // Exclude noisy background/internal events
      const ignored = ['purchase', 'login', 'logout', 'page_view', 'session_start', 'app_open', 'permission_prompt_shown', 'permission_denied', 'permission_granted', 'trial_click', 'start_trial', 'assinatura_aberta', 'tela_inicial', 'onboarding_start', 'onboarding_complete', 'install', 'app_updated', 'push_notification_received'];
      
      let allEvents: EventRow[] = [];
      const { data: evData, error: evError } = await supabase
        .from('app_events')
        .select('event_name, user_id, metadata')
        .order('created_at', { ascending: false })
        .limit(20000);
      
      if (evError) throw evError;
      
      if (evData) {
        allEvents = evData.filter(e => !ignored.includes(e.event_name));
      }
      setEvents(allEvents);

    } catch (e: any) {
      toast.error('Erro ao buscar dados: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const ranking = useMemo(() => {
    const cats: Record<string, { total: number; subs: Record<string, number> }> = {};

    events.forEach(ev => {
      // Filter by audience
      if (filter === 'premium' && !premiumIds.has(ev.user_id)) return;
      if (filter === 'free' && !freeIds.has(ev.user_id)) return;
      
      const cat = getCategory(ev.event_name);
      if (cat === 'Outros') return; // Hide internal or unknown for clean ranking
      
      const sub = getSubfunctionLabel(ev);
      
      if (!cats[cat]) cats[cat] = { total: 0, subs: {} };
      cats[cat].total++;
      cats[cat].subs[sub] = (cats[cat].subs[sub] || 0) + 1;
    });

    const sortedCats = Object.entries(cats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => {
        const sortedSubs = Object.entries(data.subs)
          .sort((a, b) => b[1] - a[1])
          .map(([subName, count]) => ({ name: subName, count }));
        return { name, total: data.total, subs: sortedSubs };
      });

    return sortedCats;
  }, [events, filter, premiumIds, freeIds]);

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Ranking de Funções" onBack={() => navigate('/admin-funcoes')} />
      
      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        
        <div className="flex items-center justify-between gap-4 bg-card border border-border p-3 rounded-2xl">
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm">Filtro de Público</span>
            <span className="text-xs text-muted-foreground">Mostrando amostragem recente</span>
          </div>
          <div className="w-[160px]">
            <Select value={filter} onValueChange={(v: AudienceFilter) => setFilter(v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                <SelectItem value="premium">Apenas Premium</SelectItem>
                <SelectItem value="free">Apenas Grátis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Calculando ranking...</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {ranking.length === 0 ? (
              <p className="text-center text-muted-foreground mt-8">Nenhum dado encontrado para o filtro atual.</p>
            ) : (
              ranking.map((cat, i) => {
                const isExpanded = expandedCats.has(cat.name);
                return (
                  <div key={cat.name} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all hover:border-primary/40">
                    <button 
                      onClick={() => toggleCat(cat.name)}
                      className="w-full flex items-center justify-between p-4 text-left active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center font-display text-sm">
                          {i + 1}º
                        </div>
                        <div>
                          <p className="font-display font-bold text-[15px] leading-tight text-foreground">{cat.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{cat.total} acessos registrados</p>
                        </div>
                      </div>
                      <div className="text-muted-foreground">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/50 bg-background/50 overflow-hidden"
                        >
                          <div className="p-3 px-4 space-y-1">
                            {cat.subs.map((sub, j) => (
                              <div key={sub.name} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                                <span className="text-sm font-medium text-foreground/80 line-clamp-1 break-all pr-3">{sub.name}</span>
                                <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full whitespace-nowrap">
                                  {sub.count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
