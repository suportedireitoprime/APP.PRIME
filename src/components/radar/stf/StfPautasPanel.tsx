import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Gavel, FileText } from 'lucide-react';

export default function StfPautasPanel() {
  const [pautas, setPautas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPautas() {
      const { data } = await (supabase as any)
        .from('radar_stf_pautas')
        .select(`
          *,
          radar_stf_ministros (
            nome,
            foto_url
          )
        `)
        .order('data_sessao', { ascending: false });

      if (data) setPautas(data);
      setLoading(false);
    }
    fetchPautas();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
      </div>
    );
  }

  if (pautas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4 bg-zinc-900/30 border border-white/5 rounded-2xl">
        <Gavel className="w-12 h-12 text-white/20 mb-4" />
        <h3 className="text-lg text-white font-medium tracking-widest uppercase mb-2">Sem pautas recentes</h3>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto">
          O scraper não identificou novas pautas de julgamento. O calendário será atualizado automaticamente pelo sistema de sincronização.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative border-l border-white/10 ml-4 md:ml-6 pl-6 py-2 space-y-12">
        {pautas.map((pauta) => (
          <div key={pauta.id} className="relative group">
            {/* Dot da timeline */}
            <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-primary border-4 border-background group-hover:scale-125 transition-transform" />
            
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary font-medium tracking-widest uppercase">
                  {new Date(pauta.data_sessao).toLocaleDateString('pt-BR')} - {pauta.tipo_sessao}
                </span>
                <span className="ml-auto text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-full uppercase tracking-wider">
                  {pauta.status}
                </span>
              </div>
              
              <h3 className="text-lg text-white font-semibold mb-3">{pauta.titulo}</h3>
              
              {pauta.resumo && (
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-4">
                  <p className="text-sm text-zinc-400 line-clamp-3">
                    {pauta.resumo}
                  </p>
                </div>
              )}
              
              {pauta.radar_stf_ministros && (
                <div className="flex items-center gap-3 mt-4 border-t border-white/5 pt-4">
                  <img 
                    src={pauta.radar_stf_ministros.foto_url} 
                    alt={pauta.radar_stf_ministros.nome} 
                    className="w-8 h-8 rounded-full border border-white/20 object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 tracking-widest uppercase">Relator</span>
                    <span className="text-sm text-zinc-200">{pauta.radar_stf_ministros.nome}</span>
                  </div>
                </div>
              )}
              
              {pauta.link_processo && (
                <a 
                  href={pauta.link_processo} 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-4 flex items-center gap-2 text-xs text-primary hover:text-primary-light transition-colors w-fit"
                >
                  <FileText className="w-3 h-3" />
                  <span>VER PROCESSO OFICIAL</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
