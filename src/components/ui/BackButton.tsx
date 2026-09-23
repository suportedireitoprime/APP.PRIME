import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
}

export function BackButton({ onClick, className = '' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    haptic.selection();
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`w-12 h-12 sm:w-[52px] sm:h-[52px] flex items-center justify-center rounded-full hover:bg-white/5 active:bg-white/10 transition-colors shrink-0 ${className}`}
      aria-label="Voltar"
    >
      <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
    </button>
  );
}
