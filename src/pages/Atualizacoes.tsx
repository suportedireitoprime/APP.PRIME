import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Hammer, Rocket, Wrench, ChevronRight, Zap } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';

interface UpdateItem {
  id: string;
  version: string;
  date: string;
  type: 'feature' | 'improvement' | 'fix';
  title: string;
  description: string;
}

const UPDATES: UpdateItem[] = [
  {
    id: '1',
    version: '1.2.0',
    date: '17 de Agosto de 2026',
    type: 'feature',
    title: 'Nova Tela de Opinião & Changelog',
    description: 'Reformulamos a tela de Opinião para ser mais fácil enviar feedbacks. Além disso, criamos esta nova área de Atualizações para você acompanhar todas as novidades do app.',
  },
  {
    id: '2',
    version: '1.1.5',
    date: '10 de Agosto de 2026',
    type: 'fix',
    title: 'Correção no Modal de Avaliação',
    description: 'Ajustamos o fluxo de avaliação do aplicativo para redirecionar corretamente para a loja de aplicativos quando o aviso nativo não estiver disponível.',
  },
  {
    id: '3',
    version: '1.1.0',
    date: '02 de Agosto de 2026',
    type: 'improvement',
    title: 'Melhorias de Performance',
    description: 'Otimizamos o carregamento das leis e da navegação offline, deixando a transição entre telas muito mais rápida e fluida.',
  },
  {
    id: '4',
    version: '1.0.0',
    date: 'Julho de 2026',
    type: 'feature',
    title: 'Lançamento do Direito Prime',
    description: 'Bem-vindo ao início de uma nova era nos seus estudos. O Vade Mecum mais avançado já criado.',
  },
];

const TYPE_CONFIG = {
  feature: {
    label: 'Novidade',
    icon: Rocket,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  improvement: {
    label: 'Melhoria',
    icon: Zap,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  fix: {
    label: 'Correção',
    icon: Wrench,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
};

export default function Atualizacoes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <PageHeader title="Atualizações" onBack={() => navigate(-1)} />

      <main className="flex-1 px-5 py-6">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/20 shadow-lg shadow-primary/5">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">O que há de novo?</h1>
              <p className="text-sm font-body text-muted-foreground mt-0.5">
                Acompanhe a evolução do aplicativo.
              </p>
            </div>
          </div>

          <div className="relative border-l-2 border-border/60 ml-4 space-y-10 pb-8">
            {UPDATES.map((update, index) => {
              const conf = TYPE_CONFIG[update.type];
              const Icon = conf.icon;
              return (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-6"
                >
                  {/* Timeline dot */}
                  <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-background border-2 ${conf.border} flex items-center justify-center`}>
                    <div className={`w-2 h-2 rounded-full ${conf.bg.replace('/10', '')}`} />
                  </div>

                  <div className="flex flex-col gap-1.5 mb-3">
                    <span className="text-[11px] font-body font-bold text-muted-foreground uppercase tracking-widest">
                      {update.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold text-foreground">
                        Versão {update.version}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${conf.bg} ${conf.color} ${conf.border}`}>
                        <Icon className="w-3 h-3" />
                        {conf.label}
                      </span>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/20 transition-colors">
                    <h3 className="font-display font-semibold text-foreground mb-1.5">
                      {update.title}
                    </h3>
                    <p className="text-sm font-body text-muted-foreground/90 leading-relaxed">
                      {update.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}
