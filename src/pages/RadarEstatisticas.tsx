import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, TrendingUp, MapPin, DollarSign, Award, Trophy, Check } from 'lucide-react';
import RadarBottomNav from '@/components/radar/RadarBottomNav';
import { getSharedConcursos } from '@/lib/concursosCache';
import { getConcursoVisual } from '@/lib/concursosVisuais';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { StateMapIcon } from '@/components/ui/StateMapIcon';
import { haptic } from '@/lib/nativeHaptics';

export default function RadarEstatisticas() {
  const navigate = useNavigate();
  const [concursos, setConcursos] = useState<any[]>([]);

  useEffect(() => {
    // 0ms Cache Load
    const cached = getSharedConcursos();
    if (cached && cached.length > 0) {
      setConcursos(cached);
    }
  }, []);

  const stats = useMemo(() => {
    if (concursos.length === 0) return null;

    const ufsCount: Record<string, number> = {};
    const careersCount: Record<string, { tag: string; count: number; image: string }> = {};
    const salaries: any[] = [];

    concursos.forEach(c => {
      // States
      if (c.uf && c.uf.length === 2) {
        const state = c.uf.toUpperCase();
        ufsCount[state] = (ufsCount[state] || 0) + 1;
      }

      // Careers
      const visual = getConcursoVisual(c.titulo || '', null, c.cargos);
      if (!careersCount[visual.profissaoKey]) {
        careersCount[visual.profissaoKey] = { tag: visual.tag, count: 0, image: visual.imagemUrl };
      }
      careersCount[visual.profissaoKey].count++;

      // Salaries
      let salNum = 0;
      if (typeof c.salario_maximo === 'number') {
        salNum = c.salario_maximo;
      } else if (typeof c.salario_maximo === 'string') {
        salNum = parseFloat(c.salario_maximo.replace(/[^\d.,]/g, '').replace(',', '.'));
      }
      if (!salNum && c.salario_texto) {
        const matches = c.salario_texto.match(/R\$\s*([\d.,]+)/);
        if (matches && matches[1]) {
          salNum = parseFloat(matches[1].replace(/\./g, '').replace(',', '.'));
        }
      }

      if (salNum > 3000) {
        salaries.push({
          id: c.id,
          titulo: c.titulo,
          uf: c.uf?.toUpperCase() || 'BR',
          valor: salNum,
          imagem: visual.imagemUrl
        });
      }
    });

    const topUfs = Object.entries(ufsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([uf, count]) => ({ uf, count }));

    const topCareers = Object.values(careersCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topSalaries = salaries
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    return { total: concursos.length, topUfs, topCareers, topSalaries };
  }, [concursos]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#0d0f12] text-white overflow-hidden pb-24">
      <ShapeGrid />

      {/* Header Nativo */}
      <div className="sticky top-0 z-40 bg-[#0d0f12]/80 backdrop-blur-xl border-b border-white/5 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-4 px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { haptic.selection(); navigate(-1); }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:opacity-70 transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-white" strokeWidth={2.4} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" /> ESTATÍSTICAS
            </h1>
            <p className="text-[11px] text-white/50 font-medium tracking-wide uppercase">Visão Macro em Tempo Real</p>
          </div>
          <div className="w-12 h-12" />
        </div>
      </div>

      <div className="relative z-10 p-5 space-y-8 max-w-2xl mx-auto">
        {!stats ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Carregando dados em cache...</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
            
            {/* Resumo */}
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
              <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-500/10" />
              <p className="text-white/60 text-sm font-medium mb-1 uppercase tracking-widest">Oportunidades no Radar</p>
              <div className="text-5xl font-display font-black text-white">{stats.total}</div>
              <p className="text-emerald-400 text-sm font-medium mt-2 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Edital publicado ou iminente
              </p>
            </motion.div>

            {/* Top Estados */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white/90">
                <MapPin className="w-5 h-5 text-blue-400" /> Estados com Mais Vagas
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stats.topUfs.map((ufData, idx) => (
                  <div key={ufData.uf} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                    <div className="absolute top-2 left-2 text-[10px] font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">#{idx + 1}</div>
                    <div className="w-12 h-12 opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all">
                      <StateMapIcon uf={ufData.uf} className="w-full h-full fill-blue-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-black text-white">{ufData.uf}</div>
                      <div className="text-xs text-white/50">{ufData.count} concursos</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Carreiras */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white/90">
                <Trophy className="w-5 h-5 text-amber-400" /> Carreiras Mais Frequentes
              </h2>
              <div className="space-y-3">
                {stats.topCareers.map((car, idx) => (
                  <div key={car.tag} className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
                      <img src={car.image} alt={car.tag} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold">{car.tag}</h3>
                      <p className="text-white/50 text-xs">{car.count} editais mapeados</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-xs border border-amber-500/20">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Maiores Salários */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white/90">
                <DollarSign className="w-5 h-5 text-green-400" /> Maiores Remunerações
              </h2>
              <div className="space-y-3">
                {stats.topSalaries.map((sal, idx) => (
                  <div key={sal.id} className="flex items-center gap-4 bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-2xl p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">{sal.uf}</span>
                      </div>
                      <h3 className="text-white text-sm font-semibold line-clamp-2">{sal.titulo}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-0.5">Até</p>
                      <p className="text-lg font-black text-green-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(sal.valor)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        )}
      </div>

      <RadarBottomNav />
    </div>
  );
}
