import { createContext, useContext, useEffect, ReactNode } from 'react';
import { secureStorage } from '@/lib/secureStorage';

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  colors: Record<string, string>;
}

function p(
  bg: string, fg: string, card: string, cardFg: string,
  primary: string, primaryFg: string, primaryLight: string,
  secondary: string, secondaryFg: string,
  muted: string, mutedFg: string,
  accent: string, accentFg: string,
  border: string, ring: string,
  copper: string, copperLight: string, copperDark: string
): Record<string, string> {
  return {
    '--background': bg, '--foreground': fg,
    '--card': card, '--card-foreground': cardFg,
    '--popover': card, '--popover-foreground': cardFg,
    '--primary': primary, '--primary-foreground': primaryFg, '--primary-light': primaryLight,
    '--secondary': secondary, '--secondary-foreground': secondaryFg,
    '--muted': muted, '--muted-foreground': mutedFg,
    '--accent': accent, '--accent-foreground': accentFg,
    '--destructive': '0 70% 55%', '--destructive-foreground': '0 0% 100%',
    '--border': border, '--input': border, '--ring': ring,
    '--sidebar-background': bg, '--sidebar-foreground': secondaryFg,
    '--sidebar-primary': primary, '--sidebar-primary-foreground': primaryFg,
    '--sidebar-accent': muted, '--sidebar-accent-foreground': secondaryFg,
    '--sidebar-border': border, '--sidebar-ring': ring,
    '--copper': copper, '--copper-light': copperLight, '--copper-dark': copperDark,
    '--gold-accent': '348 80% 50%',
  };
}

// Paleta oficial única e imutável — Rubro & Antracite (Direito Prime)
export const RUBRO_ANTRACITE_PALETTE: ThemePalette = {
  id: 'limao-antracite',
  name: 'Rubro & Antracite',
  description: 'Vermelho intenso com cinza antracite profundo',
  colors: p(
    '0 0% 5%',
    '0 0% 98%',
    '0 0% 12%',
    '0 0% 98%',
    '348 80% 50%',
    '0 0% 100%',
    '348 80% 60%',
    '0 0% 18%',
    '0 0% 96%',
    '0 0% 14%',
    '0 0% 62%',
    '0 76% 52%',
    '0 0% 100%',
    '0 0% 20%',
    '348 80% 50%',
    '348 80% 50%',
    '348 80% 60%',
    '0 78% 42%'
  ),
};

const PALETTES: ThemePalette[] = [RUBRO_ANTRACITE_PALETTE];
const STORAGE_KEY = 'vademecum-theme';

interface ThemeContextType {
  currentTheme: string;
  setTheme: (id: string) => void;
  palettes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: RUBRO_ANTRACITE_PALETTE.id,
  setTheme: () => {},
  palettes: PALETTES,
});

function applyTheme(palette: ThemePalette) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  Object.entries(palette.colors).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
  root.classList.add('dark');
  root.classList.remove('light');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyTheme(RUBRO_ANTRACITE_PALETTE);
    try {
      secureStorage.setItem(STORAGE_KEY, RUBRO_ANTRACITE_PALETTE.id);
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: RUBRO_ANTRACITE_PALETTE.id,
        setTheme: () => {},
        palettes: PALETTES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
