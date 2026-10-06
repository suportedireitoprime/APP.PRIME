import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, Medal, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { haptic } from "@/lib/nativeHaptics";

interface RankingItem {
  user_id: string;
  total_estrelas: number;
  total_licoes_concluidas: number;
  nome: string | null;
  avatar_url: string | null;
}

interface LeiSecaRankingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trilhaSlug?: string; // Se fornecido, mostra ranking específico desta lei primeiro
}

export function LeiSecaRankingSheet({ open, onOpenChange, trilhaSlug }: LeiSecaRankingSheetProps) {
  const [activeTab, setActiveTab] = useState<string>(trilhaSlug ? 'por-lei' : 'geral');

  // Buscar ranking geral
  const { data: rankingGeral, isLoading: loadGeral } = useQuery({
    queryKey: ['lei-seca-ranking-geral'],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('lei_seca_ranking_geral')
        .limit(100);
      
      if (error) throw error;
      return data as RankingItem[];
    },
    enabled: open && activeTab === 'geral',
    staleTime: 60_000,
  });

  // Buscar ranking por lei (se houver slug)
  const { data: rankingLei, isLoading: loadLei } = useQuery({
    queryKey: ['lei-seca-ranking-por-lei', trilhaSlug],
    queryFn: async () => {
      if (!trilhaSlug) return [];
      const { data, error } = await (supabase.rpc as any)('lei_seca_ranking_por_lei', { trilha_slug: trilhaSlug })
        .limit(100);
      
      if (error) throw error;
      return data as RankingItem[];
    },
    enabled: open && activeTab === 'por-lei' && !!trilhaSlug,
    staleTime: 60_000,
  });

  const handleTabChange = (value: string) => {
    haptic.selection();
    setActiveTab(value);
  };

  const renderList = (items: RankingItem[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-24 h-4 rounded-md" />
            <Skeleton className="w-16 h-3 rounded-md" />
          </div>
          <Skeleton className="w-10 h-6 rounded-md" />
        </div>
      ));
    }

    if (!items || items.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nenhum progresso registrado ainda.</p>
          <p className="text-xs mt-1">Seja o primeiro a conquistar estrelas!</p>
        </div>
      );
    }

    return items.map((item, index) => {
      const isTop1 = index === 0;
      const isTop2 = index === 1;
      const isTop3 = index === 2;

      return (
        <div 
          key={item.user_id} 
          className={`flex items-center gap-3 sm:gap-4 py-3.5 border-b border-white/5 px-2 sm:px-3 rounded-xl transition-colors ${isTop1 ? 'bg-amber-500/10 border-none my-1' : ''}`}
        >
          {/* Posição */}
          <div className="w-6 sm:w-8 text-center shrink-0 flex flex-col items-center">
            {isTop1 ? <Medal className="w-6 h-6 text-amber-400 drop-shadow-md" /> :
             isTop2 ? <Medal className="w-5 h-5 text-slate-300" /> :
             isTop3 ? <Medal className="w-5 h-5 text-amber-700" /> :
             <span className="text-xs sm:text-sm font-bold text-muted-foreground">{index + 1}º</span>}
          </div>

          {/* Avatar */}
          <div className={`relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/40 overflow-hidden border-2 ${isTop1 ? 'border-amber-400' : isTop2 ? 'border-slate-300' : isTop3 ? 'border-amber-700' : 'border-white/10'}`}>
            <Avatar className="w-full h-full">
              <AvatarImage src={item.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="bg-transparent">
                <UserIcon className="w-5 h-5 text-white/40" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Nome e Licoes */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm sm:text-[15px] font-bold truncate ${isTop1 ? 'text-amber-400' : 'text-white'}`}>
              {item.nome || 'Estudante VIP'}
            </h4>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {item.total_licoes_concluidas} {item.total_licoes_concluidas === 1 ? 'lição concluída' : 'lições concluídas'}
            </p>
          </div>

          {/* Estrelas */}
          <div className="shrink-0 flex items-center gap-1.5 bg-black/40 px-2 sm:px-3 py-1.5 rounded-full border border-white/5">
            <span className="font-extrabold text-[13px] sm:text-sm text-white tabular-nums">{item.total_estrelas}</span>
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
          </div>
        </div>
      );
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-3xl bg-[#0D0D0D] border-t border-white/10 p-0 flex flex-col"
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 shrink-0" />
        
        <SheetHeader className="px-5 pt-4 pb-2 text-left shrink-0">
          <SheetTitle className="flex items-center gap-2.5 text-xl font-black uppercase tracking-widest text-white">
            <Trophy className="w-5 h-5 text-amber-400" />
            Ranking
          </SheetTitle>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            Os maiores pontuadores da Lei Seca
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col h-full w-full">
            <div className="px-4 shrink-0">
              <TabsList className="w-full bg-white/5 border border-white/5 rounded-xl p-1 mb-2">
                <TabsTrigger value="geral" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all">
                  Ranking Geral
                </TabsTrigger>
                {trilhaSlug && (
                  <TabsTrigger value="por-lei" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all">
                    Nesta Lei
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8 min-h-0">
              <TabsContent value="geral" className="mt-0 h-full outline-none data-[state=active]:animate-in data-[state=active]:fade-in duration-300">
                <div className="flex flex-col space-y-1">
                  {renderList(rankingGeral, loadGeral)}
                </div>
              </TabsContent>

              {trilhaSlug && (
                <TabsContent value="por-lei" className="mt-0 h-full outline-none data-[state=active]:animate-in data-[state=active]:fade-in duration-300">
                  <div className="flex flex-col space-y-1">
                    {renderList(rankingLei, loadLei)}
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
