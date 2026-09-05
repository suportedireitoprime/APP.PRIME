import { directImg } from '@/lib/cdnImg';

export type LeiSecaSlug = 'cp' | 'cf' | 'cc' | 'cpp' | 'clt';

export interface LeiConfig {
  slug: LeiSecaSlug;
  title: string;
  subtitle: string;
  cover: string;
  colorClasses: string;
  textColorClass: string;
  progressColorClass: string;
  iconColor: string;
  inputFocusClass: string;
}

export const CONFIG_MAP: Record<LeiSecaSlug, LeiConfig> = {
  cp: {
    slug: 'cp',
    title: 'Código Penal',
    subtitle: 'Ouça a explicação dos artigos penais',
    cover: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg'),
    colorClasses: 'bg-[#FF3B30]/15 text-[#FF3B30]',
    textColorClass: 'text-[#FF3B30]',
    progressColorClass: 'bg-[#FF3B30]',
    iconColor: 'text-[#FF3B30]',
    inputFocusClass: 'focus:border-[#FF3B30]/50'
  },
  cf: {
    slug: 'cf',
    title: 'Constituição Federal',
    subtitle: 'Aprenda a base fundamental do Estado',
    cover: '/pilulas/cf_portrait.jpg',
    colorClasses: 'bg-blue-500/15 text-blue-400',
    textColorClass: 'text-blue-400',
    progressColorClass: 'bg-blue-500',
    iconColor: 'text-blue-500',
    inputFocusClass: 'focus:border-blue-500/50'
  },
  cc: {
    slug: 'cc',
    title: 'Código Civil',
    subtitle: 'Entenda as relações e direitos civis',
    cover: '/pilulas/cc_portrait.png',
    colorClasses: 'bg-amber-500/15 text-amber-400',
    textColorClass: 'text-amber-400',
    progressColorClass: 'bg-amber-500',
    iconColor: 'text-amber-500',
    inputFocusClass: 'focus:border-amber-500/50'
  },
  cpp: {
    slug: 'cpp',
    title: 'Código de Processo Penal',
    subtitle: 'Ritos, prazos e procedimentos penais',
    cover: '/pilulas/cpp_portrait.jpg',
    colorClasses: 'bg-emerald-500/15 text-emerald-400',
    textColorClass: 'text-emerald-400',
    progressColorClass: 'bg-emerald-500',
    iconColor: 'text-emerald-500',
    inputFocusClass: 'focus:border-emerald-500/50'
  },
  clt: {
    slug: 'clt',
    title: 'Consolidação das Leis do Trabalho',
    subtitle: 'Direitos, regras e deveres trabalhistas',
    cover: '/pilulas/clt_portrait.jpg',
    colorClasses: 'bg-orange-500/15 text-orange-400',
    textColorClass: 'text-orange-400',
    progressColorClass: 'bg-orange-500',
    iconColor: 'text-orange-500',
    inputFocusClass: 'focus:border-orange-500/50'
  }
};
