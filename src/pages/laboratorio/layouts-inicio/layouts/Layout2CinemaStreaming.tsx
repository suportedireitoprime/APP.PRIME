import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Headphones, Plus, Info, Volume2, VolumeX, 
  ChevronRight, Sparkles, Clock, Star, Flame 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export const Layout2CinemaStreaming: React.FC = () => {
  const navigate = useNavigate();
  const [somAtivo, setSomAtivo] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');

  const categorias = ['Todas', 'Direito Penal', 'Constitucional', 'Trabalhista', 'Súmulas STF', 'OAB'];

  return (
    <div className="w-full min-h-full bg-[#0D0D0D] text-white pb-24">
      {/* ── HERO BANNER CINEMATOGRÁFICO ── */}
      <div className="relative w-full h-[360px] sm:h-[400px] overflow-hidden bg-zinc-950">
        {/* Background Imersivo */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop')`,
          }}
        >
          {/* Gradients de Fusão Perfeita */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-transparent to-transparent" />
        </div>

        {/* Top Floating Controls */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[10px] tracking-widest uppercase shadow-md">
              PRIME ORIGINAL
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
              <Star className="w-3 h-3 fill-current" /> 4.9
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              try { haptic.impact('light'); } catch {};
              setSomAtivo(!somAtivo);
            }}
            className="w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center backdrop-blur-md cursor-pointer hover:bg-black/80"
          >
            {somAtivo ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
          </button>
        </div>

        {/* Informações Centrais do Hero */}
        <div className="absolute bottom-6 inset-x-4 sm:inset-x-6 z-10 space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
            <span className="text-rose-400 font-bold">AULA MASTER</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> 18 min
            </span>
            <span>·</span>
            <span>FGV / OAB XLII</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Teoria do Delito & Dolo Eventual
          </h2>

          <p className="text-xs text-zinc-300 line-clamp-2 max-w-lg leading-relaxed">
            Diferenciação prática entre dolo eventual e culpa consciente no trânsito, com 14 julgados recentes do STJ.
          </p>

          {/* Botões de Ação de Streaming */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => { try { haptic.impact('heavy'); } catch {}; navigate('/aulas-em-trilha'); }}
              className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all shadow-lg shadow-white/10 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Assistir Aula</span>
            </button>

            <button
              type="button"
              onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/audioaulas'); }}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 backdrop-blur-md border border-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <Headphones className="w-4 h-4 text-rose-400" />
              <span>Ouvir em Áudio</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTRO DE CATEGORIAS EM CHIPS ── */}
      <div className="px-4 sm:px-6 pt-4 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {categorias.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => { try { haptic.selection(); } catch {}; setCategoriaAtiva(cat); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoriaAtiva === cat
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── CARROSSEL 1: CONTINUAR ASSISTINDO ── */}
      <div className="px-4 sm:px-6 pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            Continuar Assistindo
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </h3>
          <span className="text-xs text-rose-400 font-semibold cursor-pointer">Ver histórico</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1 */}
          <div 
            onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/aulas-em-trilha'); }}
            className="rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/10 group cursor-pointer hover:border-rose-500/30 transition-all"
          >
            <div className="relative h-24 bg-zinc-950 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?q=80&w=600&auto=format&fit=crop" 
                alt="Controle de Constitucionalidade" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white/90 text-zinc-950 flex items-center justify-center shadow-md">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
              {/* Barra de Progresso */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
                <div className="h-full bg-rose-500 w-[72%]" />
              </div>
            </div>
            <div className="p-2.5">
              <h4 className="text-xs font-bold text-white truncate">Controle Concentrado</h4>
              <p className="text-[10px] text-zinc-400">ADI, ADC e ADPF · 12 min restantes</p>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/audioaulas'); }}
            className="rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/10 group cursor-pointer hover:border-rose-500/30 transition-all"
          >
            <div className="relative h-24 bg-zinc-950 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?q=80&w=600&auto=format&fit=crop" 
                alt="Processo Penal" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                  <Headphones className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
                <div className="h-full bg-rose-500 w-[45%]" />
              </div>
            </div>
            <div className="p-2.5">
              <h4 className="text-xs font-bold text-white truncate">Provas no Processo Penal</h4>
              <p className="text-[10px] text-zinc-400">Cadeia de Custódia · 8 min restantes</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARROSSEL 2: EM ALTA NA SEMANA ── */}
      <div className="px-4 sm:px-6 pt-6 space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-400 fill-current" />
          Em Alta no Direito Prime
        </h3>

        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
          {[
            { titulo: 'Furto Tentado & Súmula 567', tipo: 'ANIMAÇÃO 2D', tempo: '6 min', tag: 'OAB FGV' },
            { titulo: 'Nova Lei de Licitações (14.133)', tipo: 'ÁUDIOAULA', tempo: '22 min', tag: 'ADMINISTRATIVO' },
            { titulo: 'Reforma Tributária Esquematizada', tipo: 'VÍDEO MASTER', tempo: '34 min', tag: 'CONSTITUCIONAL' },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/aulas-em-trilha'); }}
              className="w-48 shrink-0 rounded-2xl bg-zinc-900/60 border border-white/10 p-3 hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="h-28 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/5 mb-2.5 flex flex-col justify-between p-2 relative overflow-hidden">
                <span className="self-start text-[9px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  {item.tipo}
                </span>
                <div className="text-[10px] font-medium text-zinc-400 flex items-center justify-between">
                  <span>{item.tag}</span>
                  <span>{item.tempo}</span>
                </div>
              </div>
              <h5 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-1">
                {item.titulo}
              </h5>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
