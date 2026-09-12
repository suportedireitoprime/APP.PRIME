import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, HelpCircle, BookOpen, Scale, Lightbulb, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeType = 
  | 'DICA' 
  | 'ATENÇÃO' 
  | 'ATENCAO' 
  | 'O QUE É' 
  | 'EXEMPLO' 
  | 'EXEMPLO RÁPIDO' 
  | 'JURISPRUDÊNCIA' 
  | 'JURISPRUDENCIA'
  | 'SÚMULA'
  | 'SUMULA'
  | 'IMPORTANTE';

interface PremiumBadgeProps {
  type: string;
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ type, className }) => {
  const normalizedType = type.trim().toUpperCase() as BadgeType;

  let config = {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: normalizedType,
    bg: 'bg-zinc-800/80',
    border: 'border-zinc-700/50',
    text: 'text-zinc-200',
    glow: 'shadow-none',
  };

  switch (normalizedType) {
    case 'DICA':
    case 'EXEMPLO RÁPIDO':
      config = {
        icon: <Lightbulb className="w-3.5 h-3.5" />,
        label: normalizedType,
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        border: 'border-emerald-500/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      };
      break;
    case 'ATENÇÃO':
    case 'ATENCAO':
    case 'IMPORTANTE':
      config = {
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        label: normalizedType,
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        border: 'border-rose-500/30',
        text: 'text-rose-700 dark:text-rose-300',
        glow: 'shadow-[0_0_10px_rgba(244,63,94,0.2)]',
      };
      break;
    case 'O QUE É':
    case 'EXEMPLO':
      config = {
        icon: <HelpCircle className="w-3.5 h-3.5" />,
        label: normalizedType,
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-700 dark:text-blue-300',
        glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]',
      };
      break;
    case 'JURISPRUDÊNCIA':
    case 'JURISPRUDENCIA':
    case 'SÚMULA':
    case 'SUMULA':
      config = {
        icon: <Scale className="w-3.5 h-3.5" />,
        label: normalizedType,
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        border: 'border-amber-500/30',
        text: 'text-amber-700 dark:text-amber-300',
        glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      };
      break;
    default:
      // Se a IA gerou uma tag genérica, aplicamos um estilo premium neutro
      config = {
        icon: <Info className="w-3.5 h-3.5" />,
        label: normalizedType,
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        border: 'border-indigo-500/30',
        text: 'text-indigo-700 dark:text-indigo-300',
        glow: 'shadow-[0_0_10px_rgba(99,102,241,0.2)]',
      };
      break;
  }

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded-md text-[10px] font-bold tracking-widest uppercase align-middle backdrop-blur-md border",
        config.bg,
        config.border,
        config.text,
        config.glow,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
