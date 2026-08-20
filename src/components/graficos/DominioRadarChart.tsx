import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, BarChart2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MOCK_FUNCOES = [
  { label: 'Questões', value: 85, max: 100 },
  { label: 'Flashcards', value: 60, max: 100 },
  { label: 'Vídeo Aulas', value: 40, max: 100 },
  { label: 'Leitura', value: 70, max: 100 },
  { label: 'Resumos', value: 55, max: 100 },
  { label: 'Áudio Aulas', value: 20, max: 100 },
];

const MOCK_AREAS: Record<string, any[]> = {
  'Geral': [
    { label: 'Penal', value: 75, max: 100 },
    { label: 'Civil', value: 50, max: 100 },
    { label: 'Const.', value: 90, max: 100 },
    { label: 'Admin.', value: 40, max: 100 },
    { label: 'Trabalho', value: 65, max: 100 },
    { label: 'Processo', value: 55, max: 100 },
  ],
  'Penal': [
    { label: 'Parte Geral', value: 80, max: 100 },
    { label: 'Pessoa', value: 60, max: 100 },
    { label: 'Patrimônio', value: 70, max: 100 },
    { label: 'Adm Pública', value: 45, max: 100 },
    { label: 'Legislação Especial', value: 90, max: 100 },
  ],
  'Civil': [
    { label: 'Parte Geral', value: 65, max: 100 },
    { label: 'Obrigações', value: 55, max: 100 },
    { label: 'Contratos', value: 40, max: 100 },
    { label: 'Coisas', value: 75, max: 100 },
    { label: 'Família', value: 85, max: 100 },
  ],
};

export const DominioRadarChart = () => {
  const [tipo, setTipo] = useState<'funcoes' | 'areas'>('funcoes');
  const [areaSelecionada, setAreaSelecionada] = useState<string>('Geral');

  const data = tipo === 'funcoes' ? MOCK_FUNCOES : MOCK_AREAS[areaSelecionada] || MOCK_AREAS['Geral'];

  return (
    <div className="w-full rounded-3xl border border-border/60 bg-card/40 p-4 pt-5 flex flex-col relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-primary strokeWidth={2}" />
          </div>
          <h3 className="font-display font-bold text-base text-foreground">
            Análise de Desempenho
          </h3>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-xs font-semibold text-foreground transition-colors border border-border/50">
            {tipo === 'funcoes' ? 'Hábitos' : areaSelecionada}
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => setTipo('funcoes')}
              className={tipo === 'funcoes' ? 'bg-primary/10 font-bold' : ''}
            >
              Hábitos (Funções)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setTipo('areas'); setAreaSelecionada('Geral'); }}
              className={tipo === 'areas' && areaSelecionada === 'Geral' ? 'bg-primary/10 font-bold' : ''}
            >
              Domínio Geral
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setTipo('areas'); setAreaSelecionada('Penal'); }}
              className={tipo === 'areas' && areaSelecionada === 'Penal' ? 'bg-primary/10 font-bold' : ''}
            >
              Direito Penal
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setTipo('areas'); setAreaSelecionada('Civil'); }}
              className={tipo === 'areas' && areaSelecionada === 'Civil' ? 'bg-primary/10 font-bold' : ''}
            >
              Direito Civil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
            <PolarGrid stroke="hsl(var(--border))" strokeDasharray="4 4" opacity={0.6} />
            <PolarAngleAxis 
              dataKey="label" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 700, fontFamily: 'inherit' }} 
              axisLine={false}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={false} 
              axisLine={false} 
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.2 }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                border: '1px solid hsl(var(--border))',
                padding: '8px 12px'
              }}
              itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 800, fontSize: '14px' }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}
              formatter={(value) => [`${value}%`, tipo === 'funcoes' ? 'Engajamento' : 'Domínio']}
            />
            <Radar 
              name="Desempenho" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fill="hsl(var(--primary))" 
              fillOpacity={0.35} 
              activeDot={{ r: 6, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 3 }}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
