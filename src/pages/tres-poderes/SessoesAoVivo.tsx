import { useState, useEffect } from 'react';
import { ArrowLeft, PlayCircle, Radio, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGoBack } from '@/hooks/useGoBack';

export default function SessoesAoVivo() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'completed'>('live');

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stf_live_sessions')
      .select('*')
      .eq('status', activeTab)
      .order('scheduled_start_time', { ascending: activeTab === 'upcoming' });
      
    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0D0D] overflow-x-hidden text-white font-sans">
      {/* Header Premium */}
      <div className="sticky top-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-white/5 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-4 px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => goBack()}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 text-white" strokeWidth={2.4} />
          </button>
          <div>
            <h1 className="font-display font-bold text-[20px] leading-tight flex items-center gap-2">
              SESSÕES AO VIVO
            </h1>
            <p className="text-white/50 text-[13px] leading-tight">Supremo Tribunal Federal</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 flex gap-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('live')}
          className={`flex-none px-5 py-2.5 rounded-full font-medium text-[14px] flex items-center gap-2 transition-all ${activeTab === 'live' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#1A1A1D] text-white/60 border border-white/5'}`}
        >
          <Radio className={`w-4 h-4 ${activeTab === 'live' && 'animate-pulse'}`} /> Ao Vivo Agora
        </button>
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`flex-none px-5 py-2.5 rounded-full font-medium text-[14px] flex items-center gap-2 transition-all ${activeTab === 'upcoming' ? 'bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/30' : 'bg-[#1A1A1D] text-white/60 border border-white/5'}`}
        >
          <Clock className="w-4 h-4" /> Próximas
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`flex-none px-5 py-2.5 rounded-full font-medium text-[14px] flex items-center gap-2 transition-all ${activeTab === 'completed' ? 'bg-white/10 text-white border border-white/20' : 'bg-[#1A1A1D] text-white/60 border border-white/5'}`}
        >
          <CheckCircle2 className="w-4 h-4" /> Realizadas
        </button>
      </div>

      {/* List */}
      <div className="px-4 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
        {loading ? (
          <div className="flex flex-col gap-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-[140px] aspect-video bg-white/5 rounded-xl"></div>
                <div className="flex-1 flex flex-col justify-center gap-2">
                  <div className="h-4 bg-white/5 rounded w-full"></div>
                  <div className="h-4 bg-white/5 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="mt-12 text-center text-white/40 flex flex-col items-center">
            <Radio className="w-12 h-12 mb-3 opacity-20" />
            <p>Nenhuma sessão {activeTab === 'live' ? 'acontecendo agora' : activeTab === 'upcoming' ? 'prevista' : 'registrada'} no momento.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            {sessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => navigate(`/tres-poderes/stf/podcast/${session.youtube_video_id}`)}
                className="flex gap-4 group cursor-pointer active:scale-95 transition-transform"
              >
                <div className="relative w-[140px] aspect-video bg-[#1A1A1D] rounded-xl overflow-hidden border border-white/5 shrink-0 shadow-lg">
                  <img 
                    src={session.thumbnail_url || `https://img.youtube.com/vi/${session.youtube_video_id}/mqdefault.jpg`} 
                    alt={session.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {activeTab === 'live' && (
                    <div className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      AO VIVO
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-8 h-8 text-white/90" strokeWidth={1.5} />
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col py-1 overflow-hidden">
                  <h3 className="font-body text-white/90 text-[14px] font-medium line-clamp-3 leading-snug mb-1.5">
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-sans mt-auto">
                    <Clock className="w-3 h-3" />
                    <span>
                      {session.scheduled_start_time ? new Date(session.scheduled_start_time).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Horário não definido'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
