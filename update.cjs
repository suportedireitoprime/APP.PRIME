const fs = require('fs');
let modal = fs.readFileSync('src/components/assinatura/BeneficiosTimelineModal.tsx', 'utf-8');
const newBeneficios = fs.readFileSync('new_beneficios.ts', 'utf-8');

// Replace imports
const newImports = "import { ArrowLeft, Crown, Sparkles, Scale, Bot, CheckCircle2, FileText, Headphones, Zap, Landmark, Layers, WifiOff, Award, ArrowRight, ShieldCheck, Check, Target, BookOpen, Brain, Library, GraduationCap, Tv, Gavel, Podcast, Mic, Bell, Briefcase, PenTool, Search, Trophy, Gamepad2, Map, Newspaper, FolderOpen, Globe } from 'lucide-react';";
modal = modal.replace(/import \{[\s\S]*?\} from 'lucide-react';/, newImports);

// Replace BENEFICIOS array
modal = modal.replace(/const BENEFICIOS: BeneficioTimelineItem\[\] = \[[\s\S]*?\];/, newBeneficios.trim());

// Conditionally render descricaoPersuasiva
modal = modal.replace(
  /<p className=\"text-\[11px\] sm:text-\[14px\] text-zinc-300 leading-relaxed font-normal mb-3 sm:mb-5\">\s*\{item\.descricaoPersuasiva\}\s*<\/p>/g,
  '{item.descricaoPersuasiva && (<p className=\"text-[11px] sm:text-[14px] text-zinc-300 leading-relaxed font-normal mb-3 sm:mb-5\">{item.descricaoPersuasiva}</p>)}'
);

fs.writeFileSync('src/components/assinatura/BeneficiosTimelineModal.tsx', modal);
