import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  Download, 
  Copy, 
  Check, 
  RotateCcw, 
  Sliders, 
  Palette, 
  Layers, 
  Smartphone, 
  Monitor, 
  Grid, 
  Upload, 
  ShieldCheck, 
  Sun, 
  Eye, 
  Save, 
  Trash2, 
  CheckCircle2,
  BookmarkPlus
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { toastNative } from '@/lib/nativeToast';
import logoInicioApp from '@/assets/logo-coruja.webp';
import themisOficialImg from '@/assets/icon-foreground.png';
import corujaPrimeImg from '@/assets/logo-coruja.png';
import marcaPrimeImg from '@/assets/logo-direitoprime-v2.webp';
import themisMasterImg from '@/assets/themis-master-icon.jpg';
import themisMarbleImg from '@/assets/bundled/themis-marble-cutout.webp';

interface PresetCor {
  id: string;
  nome: string;
  cat: 'oficial' | 'luxo' | 'dark' | 'juridico' | 'radial';
  tipo: 'linear' | 'radial' | 'solido';
  cor1: string;
  cor2: string;
  angulo: number;
}

const PRESETS_CORES: PresetCor[] = [
  // ── OFICIAL / VACATIO VINHO ──
  { id: 'vinho-oficial', nome: 'Vinho Vacatio (Oficial)', cat: 'oficial', tipo: 'linear', cor1: '#1f0101', cor2: '#8C1220', angulo: 135 },
  { id: 'bordeaux-nobre', nome: 'Bordeaux & Carmim', cat: 'oficial', tipo: 'linear', cor1: '#2E0208', cor2: '#7F1D1D', angulo: 145 },
  { id: 'rubi-profundo', nome: 'Rubi Prime', cat: 'oficial', tipo: 'linear', cor1: '#3B050B', cor2: '#B91C1C', angulo: 120 },
  { id: 'vinho-noite', nome: 'Vinho Noturno Onyx', cat: 'oficial', tipo: 'linear', cor1: '#120103', cor2: '#4A0510', angulo: 160 },

  // ── OURO & LUXO ──
  { id: 'ouro-obsidian', nome: 'Ouro Real & Obsidian', cat: 'luxo', tipo: 'linear', cor1: '#0a0a0a', cor2: '#b45309', angulo: 135 },
  { id: 'ambar-dourado', nome: 'Âmbar & Ouro Puro', cat: 'luxo', tipo: 'linear', cor1: '#1c1300', cor2: '#d4af37', angulo: 140 },
  { id: 'carbon-gold', nome: 'Carbono & Topázio', cat: 'luxo', tipo: 'linear', cor1: '#18181b', cor2: '#f59e0b', angulo: 120 },

  // ── DARK & OBSIDIAN ──
  { id: 'obsidian-onyx', nome: 'Obsidian Puro (Onyx)', cat: 'dark', tipo: 'linear', cor1: '#050505', cor2: '#18181b', angulo: 180 },
  { id: 'titanium-slate', nome: 'Titanium Dark Slate', cat: 'dark', tipo: 'linear', cor1: '#0f172a', cor2: '#334155', angulo: 135 },
  { id: 'preto-oled', nome: 'Preto Absoluto OLED', cat: 'dark', tipo: 'solido', cor1: '#000000', cor2: '#000000', angulo: 0 },

  // ── JURÍDICO CLÁSSICO ──
  { id: 'azul-supremo', nome: 'Azul Supremo STF', cat: 'juridico', tipo: 'linear', cor1: '#030712', cor2: '#1e3a8a', angulo: 135 },
  { id: 'esmeralda-mag', nome: 'Esmeralda Magistratura', cat: 'juridico', tipo: 'linear', cor1: '#022c22', cor2: '#065f46', angulo: 135 },
  { id: 'purpura-mp', nome: 'Púrpura Ministério Público', cat: 'juridico', tipo: 'linear', cor1: '#1e1b4b', cor2: '#581c87', angulo: 135 },
  { id: 'azul-marinho', nome: 'Azul Marinho Imperial', cat: 'juridico', tipo: 'linear', cor1: '#0a192f', cor2: '#1e40af', angulo: 145 },

  // ── RADIAL / FOCO CENTRAL ──
  { id: 'radial-vinho', nome: 'Radial Vinho Central', cat: 'radial', tipo: 'radial', cor1: '#8C1220', cor2: '#120102', angulo: 0 },
  { id: 'radial-ouro', nome: 'Radial Ouro Central', cat: 'radial', tipo: 'radial', cor1: '#d4af37', cor2: '#140c00', angulo: 0 },
  { id: 'radial-azul', nome: 'Radial Azul Central', cat: 'radial', tipo: 'radial', cor1: '#2563eb', cor2: '#030712', angulo: 0 },
];

interface LogoOption {
  id: string;
  nome: string;
  src: string;
  descricao: string;
}

const LOGOS_DISPONIVEIS: LogoOption[] = [
  { 
    id: 'themis-inicio', 
    nome: 'Têmis Vazada (Início do App)', 
    src: logoInicioApp, 
    descricao: 'Busto oficial vazado transparente da tela inicial do app' 
  },
  { 
    id: 'themis-marble', 
    nome: 'Têmis Mármore Clássica', 
    src: themisMarbleImg, 
    descricao: 'Busto clássico em mármore da deusa da justiça' 
  },
  { 
    id: 'themis-oficial', 
    nome: 'Têmis com Balança e Círculo', 
    src: themisOficialImg, 
    descricao: 'Arte completa com balança e círculo' 
  },
  { 
    id: 'coruja-prime', 
    nome: 'Coruja Prime (Saber)', 
    src: corujaPrimeImg, 
    descricao: 'Emblema dourado de sabedoria jurídica e pedagogia' 
  },
  { 
    id: 'marca-prime', 
    nome: 'Logo Direito Prime', 
    src: marcaPrimeImg, 
    descricao: 'Tipografia institucional e escudo oficial' 
  },
  { 
    id: 'themis-master', 
    nome: 'Têmis Master Completa', 
    src: themisMasterImg, 
    descricao: 'Arte completa original de Têmis' 
  },
];

interface PresetCorLogo {
  id: string;
  nome: string;
  hex: string;
}

const PRESETS_CORES_LOGO: PresetCorLogo[] = [
  { id: 'dourado-nobre', nome: 'Dourado Nobre', hex: '#D4AF37' },
  { id: 'ouro-imperial', nome: 'Ouro Imperial', hex: '#F59E0B' },
  { id: 'branco-puro', nome: 'Branco Puro', hex: '#FFFFFF' },
  { id: 'prata-titanium', nome: 'Prata Titanium', hex: '#E2E8F0' },
  { id: 'vinho-carmesim', nome: 'Vinho Carmesim', hex: '#E61942' },
  { id: 'preto-onyx', nome: 'Preto Onyx', hex: '#000000' },
  { id: 'verde-esmeralda', nome: 'Esmeralda', hex: '#10B981' },
  { id: 'azul-royal', nome: 'Azul Royal', hex: '#3B82F6' },
  { id: 'ambar-topazio', nome: 'Âmbar Topázio', hex: '#FBBF24' },
];

type FormatoIcone = 'ios' | 'circle' | 'squircle' | 'square';
type ModoVisualizacao = 'studio' | 'phone' | 'sizes' | 'store';
type SombraLogo = 'none' | 'soft' | 'deep' | 'gold_glow';
type BordaIcone = 'none' | 'gold' | 'white' | 'glow';
type TonalidadeLogo = 'original' | 'ouro' | 'branco' | 'preto' | 'contraste';

interface VariacaoSalva {
  id: string;
  nome: string;
  data: string;
  cor1: string;
  cor2: string;
  tipo: 'linear' | 'radial' | 'solido';
  angulo: number;
  logoId: string;
  formato: FormatoIcone;
  hasGloss: boolean;
  borda: BordaIcone;
}

interface IconesLogoStudioProps {
  onVoltar: () => void;
}

export function IconesLogoStudio({ onVoltar }: IconesLogoStudioProps) {
  // ── ESTADO DO FUNDO ──
  const [tipoFundo, setTipoFundo] = useState<'linear' | 'radial' | 'solido'>('linear');
  const [cor1, setCor1] = useState('#1f0101');
  const [cor2, setCor2] = useState('#8C1220');
  const [angulo, setAngulo] = useState(135);
  const [presetAtivoId, setPresetAtivoId] = useState<string>('vinho-oficial');
  const [filtroCat, setFiltroCat] = useState<'todos' | 'oficial' | 'luxo' | 'dark' | 'juridico' | 'radial'>('todos');

  // ── ESTADO DO LOGO ──
  const [logoSelecionadoId, setLogoSelecionadoId] = useState<string>('themis-inicio');
  const [modoCorLogo, setModoCorLogo] = useState<'original' | 'colorido'>('original');
  const [corLogo, setCorLogo] = useState<string>('#D4AF37');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState<number>(82); // 50% - 100%
  const [logoOffsetY, setLogoOffsetY] = useState<number>(0); // -25% a +25%
  const [sombraLogo, setSombraLogo] = useState<SombraLogo>('deep');
  const [tonalidadeLogo, setTonalidadeLogo] = useState<TonalidadeLogo>('original');

  // ── ESTADO DO FORMATO & ACABAMENTO ──
  const [formato, setFormato] = useState<FormatoIcone>('ios');
  const [hasGloss, setHasGloss] = useState<boolean>(false);
  const [borda, setBorda] = useState<BordaIcone>('gold');
  const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>('studio');

  // ── HISTÓRICO LOCAL DE TESTES ──
  const [historico, setHistorico] = useState<VariacaoSalva[]>([]);
  const [copiado, setCopiado] = useState(false);
  const [exportando, setExportando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logo ativo atual
  const activeLogoSrc = customLogoUrl || LOGOS_DISPONIVEIS.find(l => l.id === logoSelecionadoId)?.src || logoInicioApp;

  // ── APLICAR PRESET ──
  const aplicarPreset = (p: PresetCor) => {
    try { haptic.selection(); } catch {}
    setPresetAtivoId(p.id);
    setTipoFundo(p.tipo);
    setCor1(p.cor1);
    setCor2(p.cor2);
    setAngulo(p.angulo);
  };

  // ── COMPUTAR CSS DO FUNDO ──
  const getBackgroundCss = () => {
    if (tipoFundo === 'solido') return cor1;
    if (tipoFundo === 'radial') return `radial-gradient(circle at 50% 50%, ${cor1} 0%, ${cor2} 100%)`;
    return `linear-gradient(${angulo}deg, ${cor1} 0%, ${cor2} 100%)`;
  };

  // ── COMPUTAR CLASSE DE ARREDONDAMENTO ──
  const getRadiusClass = (f: FormatoIcone = formato) => {
    switch (f) {
      case 'ios': return 'rounded-[22.5%]';
      case 'circle': return 'rounded-full';
      case 'squircle': return 'rounded-3xl';
      case 'square': return 'rounded-none';
    }
  };

  // ── COMPUTAR FILTRO CSS DO LOGO ──
  const getLogoFilterCss = () => {
    let filter = '';
    // Sombra
    switch (sombraLogo) {
      case 'soft':
        filter += 'drop-shadow(0 4px 10px rgba(0,0,0,0.5)) ';
        break;
      case 'deep':
        filter += 'drop-shadow(0 10px 24px rgba(0,0,0,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.6)) ';
        break;
      case 'gold_glow':
        filter += 'drop-shadow(0 0 16px rgba(245, 158, 11, 0.65)) drop-shadow(0 4px 10px rgba(0,0,0,0.8)) ';
        break;
    }
    // Tonalidade
    switch (tonalidadeLogo) {
      case 'ouro':
        filter += 'sepia(0.8) saturate(2.5) hue-rotate(5deg) brightness(1.15) ';
        break;
      case 'branco':
        filter += 'brightness(0) invert(1) drop-shadow(0 2px 6px rgba(0,0,0,0.6)) ';
        break;
      case 'preto':
        filter += 'brightness(0) ';
        break;
      case 'contraste':
        filter += 'contrast(1.35) brightness(1.1) ';
        break;
    }
    return filter.trim();
  };

  // ── COMPUTAR BORDA DO ÍCONE ──
  const getBorderClass = (b: BordaIcone = borda) => {
    switch (b) {
      case 'gold': return 'ring-1 ring-amber-400/40 ring-inset shadow-[inset_0_1px_2px_rgba(251,191,36,0.3)]';
      case 'white': return 'ring-1 ring-white/20 ring-inset shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]';
      case 'glow': return 'ring-2 ring-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.4)]';
      case 'none': return '';
    }
  };

  // ── UPLOAD DE LOGO CUSTOMIZADO ──
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { haptic.impact('medium'); } catch {}
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomLogoUrl(result);
      setLogoSelecionadoId('custom');
      toastNative.success('Logo transparente carregado com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  // ── COPIAR CÓDIGO CSS / CORES ──
  const handleCopiarCss = async () => {
    try { haptic.impact('light'); } catch {}
    const css = `/* Ícone Direito Prime - Configuração de Fundo */
background: ${getBackgroundCss()};
--cor-primaria: ${cor1};
--cor-secundaria: ${cor2};
--angulo: ${angulo}deg;
--formato: ${formato};
--logo: ${activeLogoSrc};
--escala-logo: ${logoScale}%;
--sombra-logo: ${sombraLogo};`;

    try {
      await navigator.clipboard.writeText(css);
      setCopiado(true);
      toastNative.success('Código CSS e Hex copiados!');
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      toastNative.info(`Fundo: ${cor1} → ${cor2}`);
    }
  };

  // ── SALVAR NO HISTÓRICO DE COMPARAÇÃO ──
  const handleSalvarVariacao = () => {
    try { haptic.impact('medium'); } catch {}
    const nova: VariacaoSalva = {
      id: `var-${Date.now()}`,
      nome: `Opção ${historico.length + 1} (${cor1.toUpperCase()})`,
      data: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      cor1,
      cor2,
      tipo: tipoFundo,
      angulo,
      logoId: logoSelecionadoId,
      formato,
      hasGloss,
      borda
    };
    setHistorico(prev => [nova, ...prev.slice(0, 5)]);
    toastNative.success('Variação salva no comparador!');
  };

  // ── CARREGAR DO HISTÓRICO ──
  const handleCarregarVariacao = (v: VariacaoSalva) => {
    try { haptic.selection(); } catch {}
    setCor1(v.cor1);
    setCor2(v.cor2);
    setTipoFundo(v.tipo);
    setAngulo(v.angulo);
    setFormato(v.formato);
    setHasGloss(v.hasGloss);
    setBorda(v.borda);
    if (v.logoId !== 'custom') setLogoSelecionadoId(v.logoId);
  };

  // ── EXPORTAÇÃO HD DO ÍCONE VIA CANVAS (1024x1024 PNG) ──
  const handleExportarPng = (size = 1024) => {
    try { haptic.impact('heavy'); } catch {}
    setExportando(true);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setExportando(false);
      return;
    }

    // Clip do formato (apenas se não for square)
    if (formato === 'circle') {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    } else if (formato === 'ios' || formato === 'squircle') {
      const radius = formato === 'ios' ? size * 0.225 : size * 0.16;
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, radius);
      ctx.closePath();
      ctx.clip();
    }

    // Fundo
    if (tipoFundo === 'solido') {
      ctx.fillStyle = cor1;
      ctx.fillRect(0, 0, size, size);
    } else if (tipoFundo === 'radial') {
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7);
      grad.addColorStop(0, cor1);
      grad.addColorStop(1, cor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    } else {
      // Linear
      const rad = (angulo * Math.PI) / 180;
      const x0 = size / 2 - (Math.cos(rad) * size) / 2;
      const y0 = size / 2 - (Math.sin(rad) * size) / 2;
      const x1 = size / 2 + (Math.cos(rad) * size) / 2;
      const y1 = size / 2 + (Math.sin(rad) * size) / 2;
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, cor1);
      grad.addColorStop(1, cor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }

    // Desenhar Logo
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activeLogoSrc;

    img.onload = () => {
      // Configurar Sombra no Canvas
      if (sombraLogo === 'soft') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = size * 0.03;
        ctx.shadowOffsetY = size * 0.015;
      } else if (sombraLogo === 'deep') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = size * 0.05;
        ctx.shadowOffsetY = size * 0.03;
      } else if (sombraLogo === 'gold_glow') {
        ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
        ctx.shadowBlur = size * 0.06;
      }

      const escalaRatio = logoScale / 100;
      const logoW = size * escalaRatio;
      const logoH = size * escalaRatio;
      const x = (size - logoW) / 2;
      const y = (size - logoH) / 2 + (size * (logoOffsetY / 100));

      if (modoCorLogo === 'colorido') {
        // Pinta o logo vazado na cor personalizada via composite offscreen
        const tintCanvas = document.createElement('canvas');
        tintCanvas.width = logoW;
        tintCanvas.height = logoH;
        const tCtx = tintCanvas.getContext('2d');
        if (tCtx) {
          tCtx.drawImage(img, 0, 0, logoW, logoH);
          tCtx.globalCompositeOperation = 'source-in';
          tCtx.fillStyle = corLogo;
          tCtx.fillRect(0, 0, logoW, logoH);
          ctx.drawImage(tintCanvas, x, y);
        } else {
          ctx.drawImage(img, x, y, logoW, logoH);
        }
      } else {
        ctx.drawImage(img, x, y, logoW, logoH);
      }

      // Borda sutil no topo do canvas se ativada
      if (borda === 'gold') {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = size * 0.008;
        ctx.strokeRect(0, 0, size, size);
      } else if (borda === 'white') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = size * 0.006;
        ctx.strokeRect(0, 0, size, size);
      }

      // Baixar PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          setExportando(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `direito-prime-icone-${size}x${size}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportando(false);
        toastNative.success(`Ícone PNG ${size}x${size} baixado com sucesso!`);
      }, 'image/png');
    };

    img.onerror = () => {
      setExportando(false);
      toastNative.error('Falha ao carregar imagem para exportação.');
    };
  };

  // ── RENDERIZAÇÃO DO COMPONENTE DO ÍCONE COM PROPORÇÕES REAIS ──
  const renderIcone = (tamanhoPx: number = 240, customFormato?: FormatoIcone) => {
    const f = customFormato || formato;
    return (
      <div 
        className={`relative overflow-hidden transition-all duration-300 select-none shadow-2xl flex items-center justify-center shrink-0 ${getRadiusClass(f)} ${getBorderClass()}`}
        style={{
          width: `${tamanhoPx}px`,
          height: `${tamanhoPx}px`,
          background: getBackgroundCss(),
        }}
      >
        {/* Camada de Vinheta Sutil de Profundidade */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.65) 100%)'
          }}
        />

        {/* Imagem do Logotipo Central (Vazado com Cor Dinâmica ou Original) */}
        {modoCorLogo === 'colorido' ? (
          <div
            className="relative z-10 transition-transform duration-200 pointer-events-none"
            style={{
              width: `${logoScale}%`,
              height: `${logoScale}%`,
              transform: `translateY(${logoOffsetY}%)`,
              backgroundColor: corLogo,
              WebkitMaskImage: `url(${activeLogoSrc})`,
              maskImage: `url(${activeLogoSrc})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              filter: getLogoFilterCss(),
            }}
          />
        ) : (
          <img 
            src={activeLogoSrc} 
            alt="Logotipo"
            className="relative z-10 object-contain transition-transform duration-200 pointer-events-none"
            style={{
              width: `${logoScale}%`,
              height: `${logoScale}%`,
              transform: `translateY(${logoOffsetY}%)`,
              filter: getLogoFilterCss(),
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = logoInicioApp;
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-[calc(6rem+env(safe-area-inset-bottom,24px))] relative overflow-x-hidden">
      
      {/* ── HEADER NATIVO ── */}
      <PageHeader 
        title="TESTADOR DE ÍCONES & LOGO" 
        subtitle="Laboratório de Cores de Fundo, Gradientes & Proporções"
        onBack={onVoltar}
        variant="dark"
        rightAction={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleExportarPng(1024)}
              disabled={exportando}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Baixar PNG em Alta Resolução (1024x1024)"
            >
              <Download className="w-3.5 h-3.5 fill-black" />
              <span className="hidden sm:inline">Baixar 1024px</span>
            </button>
            <button
              type="button"
              onClick={handleCopiarCss}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all cursor-pointer"
              title="Copiar CSS e Códigos Hexadecimais"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiado ? 'Copiado!' : 'Copiar CSS'}</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-6">

        {/* ── SELETOR DE MODO DE VISUALIZAÇÃO (TABS) ── */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3 overflow-x-auto [scrollbar-width:none]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {} setModoVisualizacao('studio'); }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                modoVisualizacao === 'studio'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Studio 360° (Grande)</span>
            </button>

            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {} setModoVisualizacao('phone'); }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                modoVisualizacao === 'phone'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Smartphone Real</span>
            </button>

            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {} setModoVisualizacao('sizes'); }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                modoVisualizacao === 'sizes'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Escalas do Sistema</span>
            </button>

            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {} setModoVisualizacao('store'); }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                modoVisualizacao === 'store'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Card Play Store</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSalvarVariacao}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Salvar Variação</span>
            </button>
          </div>
        </div>

        {/* ── ÁREA PRINCIPAL: GRID RESPONSIVO (ESQUERDA: PREVIEW / DIREITA: CONTROLES) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ══════════════════════════════════════════════
              COLUNA ESQUERDA: CANVAS & MOCKUPS (5 COLS)
             ══════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            
            {/* ── CARD PRINCIPAL DO PREVIEW ── */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
              
              {/* Textura de fundo suave */}
              <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

              {/* Tag com Formato Atual */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-zinc-900/90 text-zinc-300 border border-white/10">
                  {formato === 'ios' && 'iOS Squircle (22.5%)'}
                  {formato === 'circle' && 'Android Círculo (Adaptive)'}
                  {formato === 'squircle' && 'Android Rounded (OneUI)'}
                  {formato === 'square' && 'Quadrado Master (1024px)'}
                </span>
              </div>

              {/* ── MODO 1: STUDIO 360° GRANDE ── */}
              {modoVisualizacao === 'studio' && (
                <div className="relative py-6 flex flex-col items-center justify-center">
                  {/* Sombra de chão */}
                  <div className="relative">
                    {renderIcone(250)}
                    <div 
                      className="absolute -bottom-5 inset-x-4 h-6 rounded-full blur-xl opacity-60 pointer-events-none"
                      style={{ background: cor2 }}
                    />
                  </div>

                  {/* Informações Hex das Cores Atuais */}
                  <div className="mt-7 flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-white/5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: cor1 }} />
                    <span className="text-zinc-200 font-bold">{cor1.toUpperCase()}</span>
                    {tipoFundo !== 'solido' && (
                      <>
                        <span className="text-zinc-500">→</span>
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: cor2 }} />
                        <span className="text-zinc-200 font-bold">{cor2.toUpperCase()}</span>
                        <span className="text-zinc-500">({angulo}°)</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── MODO 2: SMARTPHONE HOMESCREEN ── */}
              {modoVisualizacao === 'phone' && (
                <div className="w-full max-w-[280px] rounded-[40px] border-[5px] border-zinc-700 bg-black p-3.5 shadow-2xl relative overflow-hidden my-1">
                  {/* Dynamic Island / Notch */}
                  <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto mb-3 flex items-center justify-end px-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500/60" />
                  </div>

                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 px-2 mb-4">
                    <span>09:41</span>
                    <span>5G 100%</span>
                  </div>

                  {/* Wallpaper sutil com apps secundários simulados */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">19</div>
                        <span className="text-[8.5px] font-sans text-zinc-300">Calendário</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">📝</div>
                        <span className="text-[8.5px] font-sans text-zinc-300">Notas</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">📷</div>
                        <span className="text-[8.5px] font-sans text-zinc-300">Fotos</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white text-xs font-bold">⚙️</div>
                        <span className="text-[8.5px] font-sans text-zinc-300">Ajustes</span>
                      </div>
                    </div>

                    {/* Espaço central */}
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-[10px] font-mono text-zinc-500 italic">Área de Trabalho</span>
                    </div>

                    {/* DOCK INFERIOR COM O ÍCONE DO DIREITO PRIME AO VIVO */}
                    <div className="rounded-3xl bg-white/10 backdrop-blur-md p-2 grid grid-cols-4 gap-2 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-11 h-11 rounded-2xl bg-green-500 flex items-center justify-center text-white text-base">📞</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-base">💬</div>
                      </div>
                      {/* ── NOSSO ÍCONE NO DOCK ── */}
                      <div className="flex flex-col items-center transform scale-105">
                        {renderIcone(44)}
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-base">🧭</div>
                      </div>
                    </div>
                    <div className="text-center pt-0.5">
                      <span className="text-[9px] font-bold text-amber-300 tracking-tight">Direito Prime</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── MODO 3: ESCALAS DO SISTEMA ── */}
              {modoVisualizacao === 'sizes' && (
                <div className="w-full space-y-4 py-2">
                  <div className="flex items-center justify-around gap-2 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      {renderIcone(96)}
                      <span className="text-[10px] font-mono text-zinc-400">96px · Home</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      {renderIcone(64)}
                      <span className="text-[10px] font-mono text-zinc-400">64px · Grade</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      {renderIcone(48)}
                      <span className="text-[10px] font-mono text-zinc-400">48px · Dock</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      {renderIcone(32)}
                      <span className="text-[10px] font-mono text-zinc-400">32px · Tab</span>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-center text-zinc-500 pt-2">
                    Verifique se o contraste e contorno do logotipo permanecem nítidos até 32px.
                  </p>
                </div>
              )}

              {/* ── MODO 4: PLAY STORE CARD ── */}
              {modoVisualizacao === 'store' && (
                <div className="w-full rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 space-y-3.5">
                  <div className="flex items-start gap-3.5">
                    {renderIcone(72)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white leading-tight">Direito Prime: Vade Mecum</h4>
                      <p className="text-[11px] text-emerald-400 font-medium">Estudos Jurídicos & Áudio</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-mono">
                        <span className="text-amber-400 font-bold">4.9 ★★★★★</span>
                        <span>•</span>
                        <span>100 mil+ downloads</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-md transition-all pointer-events-none text-center"
                  >
                    Instalar
                  </button>
                </div>
              )}

              {/* ── SELETOR RÁPIDO DE FORMATO DO ÍCONE ── */}
              <div className="mt-5 pt-3 border-t border-zinc-800/80 w-full flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-1">Formato:</span>
                <button
                  type="button"
                  onClick={() => { try { haptic.selection(); } catch {} setFormato('ios'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    formato === 'ios' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  iOS (Squircle)
                </button>
                <button
                  type="button"
                  onClick={() => { try { haptic.selection(); } catch {} setFormato('circle'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    formato === 'circle' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  Android (Círculo)
                </button>
                <button
                  type="button"
                  onClick={() => { try { haptic.selection(); } catch {} setFormato('squircle'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    formato === 'squircle' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  OneUI
                </button>
                <button
                  type="button"
                  onClick={() => { try { haptic.selection(); } catch {} setFormato('square'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    formato === 'square' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  Quadrado
                </button>
              </div>
            </div>

            {/* ── HISTÓRICO DE VARIAÇÕES SALVAS (COMPARAÇÃO LADO A LADO) ── */}
            {historico.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider">Comparações Salvas ({historico.length})</span>
                  <button
                    type="button"
                    onClick={() => setHistorico([])}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {historico.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleCarregarVariacao(v)}
                      className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer shrink-0"
                    >
                      <div 
                        className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                        style={{
                          background: v.tipo === 'solido' ? v.cor1 : `linear-gradient(${v.angulo}deg, ${v.cor1}, ${v.cor2})`
                        }}
                      >
                        <img src={activeLogoSrc} alt="" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-300 font-bold pr-1">{v.cor1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ══════════════════════════════════════════════
              COLUNA DIREITA: CONTROLES & PALETAS (7 COLS)
             ══════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* ── SEÇÃO 1: PRESETS DE CORES DE FUNDO ── */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3.5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    Paletas & Presets de Fundo
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-amber-400 font-bold">1-Toque</span>
              </div>

              {/* Categorias dos Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'oficial', label: '🍷 Vinho Vacatio' },
                  { id: 'luxo', label: '👑 Ouro & Luxo' },
                  { id: 'dark', label: '🌌 Obsidian' },
                  { id: 'juridico', label: '⚖️ Jurídico' },
                  { id: 'radial', label: '🎯 Radial' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFiltroCat(c.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                      filtroCat === c.id 
                        ? 'bg-amber-500 text-black' 
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Grid de Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESETS_CORES
                  .filter(p => filtroCat === 'todos' || p.cat === filtroCat)
                  .map((p) => {
                    const isAtivo = presetAtivoId === p.id && cor1 === p.cor1 && cor2 === p.cor2;
                    const bgStyle = p.tipo === 'solido' 
                      ? p.cor1 
                      : p.tipo === 'radial' 
                      ? `radial-gradient(circle, ${p.cor1}, ${p.cor2})` 
                      : `linear-gradient(${p.angulo}deg, ${p.cor1}, ${p.cor2})`;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => aplicarPreset(p)}
                        className={`flex items-center gap-2.5 p-2 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 ${
                          isAtivo 
                            ? 'bg-zinc-800 border-amber-400 shadow-md shadow-amber-500/10' 
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-xl shrink-0 shadow-md flex items-center justify-center relative overflow-hidden"
                          style={{ background: bgStyle }}
                        >
                          <img src={activeLogoSrc} alt="" className="w-6 h-6 object-contain pointer-events-none" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isAtivo ? 'text-amber-300' : 'text-zinc-200'}`}>
                            {p.nome}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-400 truncate">
                            {p.cor1} → {p.cor2}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* ── PERSONALIZAÇÃO MANUAL DE CORES ── */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Ajuste Fino de Cores & Gradiente:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Cor 1 */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                    <input 
                      type="color" 
                      value={cor1} 
                      onChange={(e) => { setCor1(e.target.value); setPresetAtivoId('custom'); }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9.5px] font-mono text-zinc-400 uppercase block">Cor 1</span>
                      <input 
                        type="text" 
                        value={cor1} 
                        onChange={(e) => { setCor1(e.target.value); setPresetAtivoId('custom'); }}
                        className="w-full bg-transparent font-mono text-xs font-bold text-white focus:outline-none uppercase" 
                      />
                    </div>
                  </div>

                  {/* Cor 2 */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                    <input 
                      type="color" 
                      value={cor2} 
                      onChange={(e) => { setCor2(e.target.value); setPresetAtivoId('custom'); }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9.5px] font-mono text-zinc-400 uppercase block">Cor 2</span>
                      <input 
                        type="text" 
                        value={cor2} 
                        onChange={(e) => { setCor2(e.target.value); setPresetAtivoId('custom'); }}
                        className="w-full bg-transparent font-mono text-xs font-bold text-white focus:outline-none uppercase" 
                      />
                    </div>
                  </div>

                  {/* Ângulo / Tipo */}
                  <div className="flex flex-col justify-center p-2 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="flex justify-between items-center text-[9.5px] font-mono text-zinc-400">
                      <span>ÂNGULO</span>
                      <span className="text-amber-400 font-bold">{angulo}°</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="360" 
                      step="5"
                      value={angulo} 
                      onChange={(e) => setAngulo(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer" 
                    />
                  </div>
                </div>

                {/* Alternância Linear / Radial / Sólido */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Tipo:</span>
                  {(['linear', 'radial', 'solido'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipoFundo(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold capitalize transition-all cursor-pointer ${
                        tipoFundo === t ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SEÇÃO 2: SELETOR DE LOGO & ESCALA ── */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    Logotipo Sobreposto
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo PNG</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUploadLogo} 
                  accept="image/png,image/webp,image/svg+xml" 
                  className="hidden" 
                />
              </div>

              {/* Grid de Logos Disponíveis */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {LOGOS_DISPONIVEIS.map((logo) => {
                  const isSelected = logoSelecionadoId === logo.id && !customLogoUrl;
                  return (
                    <button
                      key={logo.id}
                      type="button"
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        setLogoSelecionadoId(logo.id);
                        setCustomLogoUrl(null);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                        isSelected 
                          ? 'bg-zinc-800 border-amber-400 shadow-md shadow-amber-500/15' 
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center p-1">
                        <img src={logo.src} alt={logo.nome} className="max-w-full max-h-full object-contain" />
                      </div>
                      <span className={`text-[11px] font-bold line-clamp-1 ${isSelected ? 'text-amber-300' : 'text-zinc-300'}`}>
                        {logo.nome}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sliders de Escala & Posição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
                {/* Slider Escala */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400">Escala / Proporção do Logo</span>
                    <span className="text-amber-400 font-bold">{logoScale}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    step="1"
                    value={logoScale} 
                    onChange={(e) => setLogoScale(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer" 
                  />
                </div>

                {/* Slider Offset Y */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400">Posição Vertical (Y)</span>
                    <span className="text-amber-400 font-bold">{logoOffsetY > 0 ? `+${logoOffsetY}` : logoOffsetY}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="-20" 
                    max="20" 
                    step="1"
                    value={logoOffsetY} 
                    onChange={(e) => setLogoOffsetY(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer" 
                  />
                </div>
              </div>

              {/* Efeitos do Logo: Sombra & Tonalidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Sombra */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">Sombra Projetada:</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'none', label: 'Zero' },
                      { id: 'soft', label: 'Suave' },
                      { id: 'deep', label: '3D Real' },
                      { id: 'gold_glow', label: 'Glow' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSombraLogo(s.id as any)}
                        className={`py-1 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                          sombraLogo === s.id ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tonalidade */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">Tonalidade do Logo:</span>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { id: 'original', label: 'Orig.' },
                      { id: 'ouro', label: 'Ouro' },
                      { id: 'branco', label: 'White' },
                      { id: 'preto', label: 'Black' },
                      { id: 'contraste', label: 'Vívido' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTonalidadeLogo(t.id as any)}
                        className={`py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          tonalidadeLogo === t.id ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── MUDANÇA DE COR DO LOGOTIPO (VAZADO DINÂMICO) ── */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cor do Logotipo Vazado:</span>
                  </span>

                  {/* Toggle Original vs Colorido */}
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => { try { haptic.selection(); } catch {} setModoCorLogo('original'); }}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                        modoCorLogo === 'original' 
                          ? 'bg-amber-500 text-black shadow' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => { try { haptic.selection(); } catch {} setModoCorLogo('colorido'); }}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                        modoCorLogo === 'colorido' 
                          ? 'bg-amber-500 text-black shadow' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Mudar Cor
                    </button>
                  </div>
                </div>

                {modoCorLogo === 'colorido' && (
                  <div className="space-y-2.5 p-3 rounded-2xl bg-zinc-950 border border-amber-500/20">
                    <span className="text-[10px] font-mono text-zinc-400 block">
                      Escolha a cor do logotipo vazado:
                    </span>

                    {/* Presets de Cor do Logo */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESETS_CORES_LOGO.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { try { haptic.selection(); } catch {} setCorLogo(c.hex); }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10.5px] font-mono transition-all cursor-pointer active:scale-95 ${
                            corLogo.toLowerCase() === c.hex.toLowerCase()
                              ? 'bg-zinc-800 border-amber-400 text-white font-bold'
                              : 'bg-zinc-900 border-white/5 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: c.hex }} />
                          <span>{c.nome}</span>
                        </button>
                      ))}
                    </div>

                    {/* Seletor Customizado de Cor */}
                    <div className="flex items-center gap-2 pt-1">
                      <input 
                        type="color" 
                        value={corLogo} 
                        onChange={(e) => setCorLogo(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0" 
                      />
                      <input 
                        type="text" 
                        value={corLogo} 
                        onChange={(e) => setCorLogo(e.target.value)}
                        placeholder="#D4AF37"
                        className="bg-zinc-900 px-2.5 py-1 rounded-lg border border-white/10 font-mono text-xs font-bold text-amber-300 w-28 uppercase focus:outline-none" 
                      />
                      <span className="text-[10px] font-mono text-zinc-500">
                        Qualquer cor RGB
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ── SEÇÃO 3: ACABAMENTOS (BORDA E ESTILO) ── */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3.5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    Borda & Acabamento Limpo
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">Design Puro / Fosco (Sem Reflexos)</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-xs font-bold text-white block">Filete de Contorno do Ícone:</span>
                  <span className="text-[10px] font-mono text-zinc-400">Destaque e acabamento nas bordas</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'none', label: 'Zero' },
                    { id: 'gold', label: 'Dourada' },
                    { id: 'white', label: 'Branca' },
                    { id: 'glow', label: 'Neon' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBorda(b.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        borda === b.id ? 'bg-amber-500 text-black shadow' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SEÇÃO 4: AÇÕES FINAIS & EXPORTAÇÃO ── */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-zinc-900/60 to-zinc-900/40 p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Pronto para usar no App?</span>
                </h4>
                <p className="text-xs text-zinc-300">
                  Baixe o PNG mestre em 1024x1024 ou copie o código CSS para aplicar no projeto.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleExportarPng(1024)}
                  disabled={exportando}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 fill-black" />
                  <span>Baixar PNG 1024px</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopiarCss}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 active:scale-95 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
