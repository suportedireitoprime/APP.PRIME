import React from 'react';
import { Loader2 } from 'lucide-react';

interface SocialButtonsProps {
  onGoogle: () => void;
  onApple: () => void;
  googleLoading: boolean;
  appleLoading: boolean;
}

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="24" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4c-58.3-81.5-105.9-207.3-105.9-326.5C0 407.4 80.8 251.3 213.7 251.3c61.6 0 113.1 40.8 152 40.8 36.8 0 94.4-43.2 165.3-43.2 26.7 0 122.6 2.6 185.1 92zM554.1 0c3.9 28 .1 62.8-17.5 95.8-20.7 36.8-55.2 61.6-93.8 58.3-4.5-26.1.6-58.3 19.4-89 22-35.5 59-60.9 91.9-65.1z" fill="currentColor"/>
  </svg>
);

export const SocialButtons: React.FC<SocialButtonsProps> = ({
  onGoogle,
  onApple,
  googleLoading,
  appleLoading,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <button
        onClick={onGoogle}
        disabled={googleLoading || appleLoading}
        className="w-full flex items-center justify-center gap-3 h-14 bg-white text-zinc-900 rounded-2xl font-bold transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
        <span className="text-sm font-semibold tracking-wide">Entrar com Google</span>
      </button>

      <button
        onClick={onApple}
        disabled={appleLoading || googleLoading}
        className="w-full flex items-center justify-center gap-3 h-14 bg-white text-zinc-900 rounded-2xl font-bold transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {appleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AppleIcon />}
        <span className="text-sm font-semibold tracking-wide">Entrar com Apple</span>
      </button>
    </div>
  );
};
