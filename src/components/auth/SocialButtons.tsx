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
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.48 10.15c-.03-2.73 2.23-4.05 2.33-4.11-1.27-1.85-3.24-2.1-3.95-2.13-1.68-.17-3.27.99-4.13.99-.86 0-2.18-1-3.58-.97-1.82.02-3.49 1.06-4.42 2.68-1.9 3.28-.48 8.12 1.37 10.79.91 1.3 1.98 2.75 3.39 2.7 1.35-.05 1.86-.88 3.5-.88 1.63 0 2.1.88 3.53.85 1.46-.02 2.38-1.3 3.26-2.58 1.02-1.49 1.44-2.94 1.46-3.01-.03-.02-2.83-1.08-2.86-4.33zM15.01 4.59c.75-.91 1.25-2.17 1.12-3.42-1.08.04-2.4.72-3.17 1.63-.68.8-.13 2.08-.03 3.32 1.21.09 2.34-.63 3.08-1.53z" />
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
