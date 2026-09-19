import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lipsync } from 'wawa-lipsync';

import { FaceWoman } from './avatars/FaceWoman';
import { FaceOwl } from './avatars/FaceOwl';
import { FaceYellow } from './avatars/FaceYellow';
import { FaceRobot } from './avatars/FaceRobot';
import { FaceCat } from './avatars/FaceCat';
import { FaceBear } from './avatars/FaceBear';
import { FaceAlien } from './avatars/FaceAlien';
import { FaceMan } from './avatars/FaceMan';
import { FaceNinja } from './avatars/FaceNinja';
import { FaceDog } from './avatars/FaceDog';

export const WawaLipsyncTest: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lipsyncRef = useRef<Lipsync | null>(null);
  const requestRef = useRef<number>();
  
  const [viseme, setViseme] = useState<string>('sil');
  const [volume, setVolume] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [audios, setAudios] = useState<{titulo: string, url: string}[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string>('');

  useEffect(() => {
    // Busca 3 áudios reais do Vade Mecum
    const fetchAudios = async () => {
      const { data } = await supabase
        .from('narracoes_artigos')
        .select('titulo_artigo, artigo_numero, audio_url')
        .not('audio_url', 'is', null)
        .limit(3);
        
      let list = [{ titulo: 'Artigo 3 (Masculino)', url: '/artigo_3_masculino.wav' }];

      if (data && data.length > 0) {
        const remoteList = data.map((d: any) => ({ titulo: d.titulo_artigo || `Art. ${d.artigo_numero}`, url: d.audio_url }));
        list = [...list, ...remoteList];
      } else {
        list = [...list, { titulo: 'Áudio Local (Placeholder)', url: '/laboratorio/teste-lipsync.mp3' }];
      }
      
      setAudios(list);
      setSelectedAudio(list[0].url);
    };
    fetchAudios();

    // Loop
    const update = () => {
      if (lipsyncRef.current && isPlaying) {
        lipsyncRef.current.processAudio();
        setViseme(lipsyncRef.current.viseme.replace('viseme_', ''));
        setVolume(lipsyncRef.current.features?.volume || 0);
      }
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  const handlePlay = async () => {
    if (!audioRef.current) return;
    
    // Instancia o Lipsync AQUI no momento do clique, para garantir que o AudioContext não fique "suspended"
    if (!lipsyncRef.current) {
      lipsyncRef.current = new Lipsync();
    } else {
      // Força o resume caso o contexto tenha sido pausado pelo navegador
      const ctx = (lipsyncRef.current as any).audioContext;
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
    }
    
    if (!isPlaying) {
      try {
        lipsyncRef.current.connectAudio(audioRef.current);
      } catch (e) {
        // Ignora se já estiver conectado
      }
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      console.error("Erro ao tocar áudio", e);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setViseme('sil');
      setVolume(0);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full">
      <h3 className="text-xl font-bold text-white text-center">Laboratório Wawa-Lipsync (Motor 2D Múltiplo)</h3>
      
      {/* Visualizer Grid */}
      <div className="w-full bg-zinc-950 rounded-xl p-6 border border-zinc-800">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="bg-[#111] p-4 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden group">
            <span className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold z-10">MULHER</span>
            <FaceWoman viseme={viseme} volume={volume} />
          </div>
          <div className="bg-[#111] p-4 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden group">
            <span className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold z-10">CORUJA</span>
            <FaceOwl viseme={viseme} volume={volume} />
          </div>
          <div className="bg-[#111] p-4 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden group">
            <span className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold z-10">EMOJI</span>
            <FaceYellow viseme={viseme} volume={volume} />
          </div>
          <div className="bg-[#111] p-4 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden group">
            <span className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold z-10">ROBÔ</span>
            <FaceRobot viseme={viseme} volume={volume} />
          </div>
          <div className="bg-[#111] p-4 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden group">
            <span className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold z-10">GATO</span>
            <FaceCat viseme={viseme} volume={volume} />
          </div>
          <div className="bg-[#111] p-4 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden group">
            <span className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold z-10">URSO</span>
            <FaceBear viseme={viseme} volume={volume} />
          </div>
          <div className="bg-[#111] p-4 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden group">
            <span className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold z-10">ALIEN</span>
            <FaceAlien viseme={viseme} volume={volume} />
          </div>
          <div className="bg-[#111] p-4 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden group">
            <span className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold z-10">HOMEM</span>
            <FaceMan viseme={viseme} volume={volume} />
          </div>
          <div className="bg-[#111] p-4 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden group">
            <span className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold z-10">NINJA</span>
            <FaceNinja viseme={viseme} volume={volume} />
          </div>
          <div className="bg-[#111] p-4 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden group">
            <span className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold z-10">CACHORRO</span>
            <FaceDog viseme={viseme} volume={volume} />
          </div>
        </div>
        
        {/* Info & Volume Bar */}
        <div className="mt-6 p-4 bg-[#111] rounded-lg">
          <div className="text-xs font-mono text-zinc-400 mb-2 flex justify-between">
            <span>Viseme Atual: <strong className="text-primary">{viseme}</strong></span>
            <span>Volume Analisador: {volume.toFixed(3)}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${Math.min(volume * 1000, 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end mt-4">
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-sm font-semibold text-zinc-300">Selecione um áudio real do banco:</label>
          <select 
            className="bg-zinc-800 text-white p-2 rounded text-sm w-full"
            value={selectedAudio}
            onChange={(e) => {
              setSelectedAudio(e.target.value);
              handlePause();
            }}
          >
            {audios.map((a, idx) => (
              <option key={idx} value={a.url}>{a.titulo}</option>
            ))}
          </select>
        </div>

        <audio 
          ref={audioRef} 
          src={selectedAudio} 
          crossOrigin="anonymous"
          onEnded={() => { setIsPlaying(false); setViseme('sil'); setVolume(0); }} 
        />

        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded font-medium disabled:opacity-50 transition-colors"
          >
            Tocar Áudio
          </button>
          <button
            onClick={handlePause}
            disabled={!isPlaying}
            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-medium disabled:opacity-50 transition-colors"
          >
            Pausar
          </button>
        </div>
      </div>
    </div>
  );
};
