import { Gavel, Scale, BookOpen, VolumeX } from 'lucide-react';
import icon from '@/assets/logo-direitoprime-v2.webp';

interface Props {
  title: string;
  concept: string;
  practice: string;
  username?: string;
  category?: string;
}

export default function InstagramFlashcardSlide({ 
  title, 
  concept, 
  practice, 
  username = '@app.prime',
  category = 'JURIDIQUÊS'
}: Props) {
  return (
    <div 
      className="relative flex flex-col overflow-hidden w-[1080px] h-[1080px] select-none text-foreground"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--brand-burgundy-deep)) 0%, hsl(var(--brand-burgundy-bright)) 55%, hsl(var(--primary)) 100%)',
      }}
    >
      {/* Background SVGs */}
      <Scale className="absolute -bottom-24 -right-24 w-[500px] h-[500px] text-white/[0.03] pointer-events-none" />
      <Gavel className="absolute -top-10 -left-20 w-[400px] h-[400px] text-white/[0.03] rotate-[-15deg] pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_60%)]" />

      {/* Header */}
      <div className="flex items-center justify-between px-16 pt-16 z-10">
        <div className="flex items-center gap-4 text-white font-black tracking-widest text-2xl uppercase">
          <BookOpen className="w-10 h-10 text-white" />
          ESTUDOS JURÍDICOS
        </div>
        <div className="text-white/80 font-medium text-2xl">
          {username}
        </div>
      </div>

      <div className="flex-1 flex flex-col px-16 py-12 z-10">
        {/* Badge */}
        <div className="self-start bg-white/10 text-white/90 font-bold uppercase tracking-widest text-xl px-6 py-2 rounded-full mb-8 shadow-sm backdrop-blur-sm border border-white/10">
          {category}
        </div>

        {/* Title */}
        <h1 className="text-white text-[75px] font-black leading-tight mb-8 drop-shadow-md font-display">
          {title}
        </h1>

        {/* Concept Box */}
        <div className="bg-white rounded-3xl p-10 mb-8 shadow-2xl relative border-l-8 border-indigo-600">
          <div className="text-indigo-600 font-serif text-[80px] leading-none absolute top-6 left-8">
            "
          </div>
          <p className="text-[40px] text-slate-800 font-medium leading-[1.4] mt-6 ml-2">
            {concept}
          </p>
        </div>

        {/* Practice Section */}
        <div className="pl-6 border-l-[6px] border-indigo-600 mt-2">
          <h3 className="text-white/70 uppercase tracking-widest font-bold text-xl mb-3">
            Na Prática
          </h3>
          <p className="text-[38px] text-white font-medium leading-[1.3] drop-shadow-sm">
            {practice}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-16 pb-12 z-10">
        <div className="flex-1 text-center">
          <span className="text-white/60 text-2xl font-semibold">
            Suas leis sempre atualizadas!
          </span>
        </div>
        <div className="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-inner absolute right-16 bottom-12">
          <VolumeX className="w-8 h-8 text-white/80" />
        </div>
      </div>
      
      {/* App Logo Overlaid on bottom left */}
      <div className="absolute left-16 bottom-12 z-20">
        <img src={icon} alt="Logo" className="w-20 h-20 rounded-2xl shadow-xl border border-white/20" />
      </div>
    </div>
  );
}
