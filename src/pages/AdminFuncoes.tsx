import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  ChevronRight,
  Activity,
  ShieldCheck,
  ClipboardList,
  BookOpen,
  Gamepad2,
  Brain,
  MessageCircle,
  BellRing,
  Mic,
  Lightbulb,
  Building2,
  Rss,
  Palette,
  Users,
  GitBranch,
  Github,
  KeyRound,
  Bug,
  Newspaper,
  Quote,
  Monitor,
  Send,
  RefreshCcw,
  Lock,
  Wrench,
  FileText,
  Crown,
  Search,
  Target,
  MapPin,
  PlayCircle,
  Sparkles,
  UserPlus,
  GraduationCap,
  Scale,
  Store,
  Mail,
  FileSignature,
  ListChecks,
  Headphones,
  ShieldAlert,
  Layers,
  Star,
  CloudDownload,
  Pill,
  UserCheck,
  Bird,
  FileSpreadsheet,
  Gauge,
  Route as RouteIcon,
} from "lucide-react";

import { toast } from "sonner";
import { PageHeader } from "@/components/vademecum/navigation/PageHeader";
import { AdminHojeCards } from "@/components/admin/AdminHojeCards";

// Prefetch map
const PREFETCH: Record<string, () => Promise<unknown>> = {
  "/admin-aulas-interativas": () => import("./AdminAulasInterativas"),
  "/admin-push": () => import("./AdminPush"),
  "/admin-horus": () => import("./AdminHorus"),
  "/admin-omniroute": () => import("./AdminOmniRouteTeste"),
  "/admin-rotas": () => import("./AdminRotas"),
  "/explicacao-lei": () => import("./ExplicacaoLei"),
};
const prefetched = new Set<string>();
const prefetching = new Map<string, Promise<unknown>>();
const prefetch = (route?: string): Promise<unknown> => {
  const factory = route ? PREFETCH[route] : undefined;
  if (!route || !factory) return Promise.resolve();
  if (prefetched.has(route)) return Promise.resolve();
  const existing = prefetching.get(route);
  if (existing) return existing;
  const promise = factory()
    .then((result) => {
      prefetched.add(route);
      prefetching.delete(route);
      return result;
    })
    .catch((error) => {
      prefetching.delete(route);
      throw error;
    });
  prefetching.set(route, promise);
  return promise;
};

const prefetchAllAdminRoutes = () => {
  const routes = Array.from(
    new Set(
      CATEGORIES.flatMap((cat) => (cat.items || []).map((item) => item.route).filter(Boolean)),
    ),
  ) as string[];
  routes.forEach(prefetch);
};

/** Paleta de cores dos ícones — cada função ganha um tom próprio, sem fundo. */
const ICON_HUES = [
  "0 72% 58%",
  "18 88% 58%",
  "36 92% 55%",
  "48 90% 55%",
  "84 60% 50%",
  "150 60% 45%",
  "168 66% 45%",
  "19348 80% 50%",
  "208 80% 58%",
  "224 76% 62%",
  "258 70% 66%",
  "280 66% 64%",
  "310 66% 60%",
  "336 70% 58%",
];
function iconColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `hsl(${ICON_HUES[h % ICON_HUES.length]})`;
}

type Item = {
  id: string;
  label: string;
  desc: string;
  icon: any;
  route?: string;
};

type Category = {
  id: string;
  title: string;
  desc: string;
  icon: any;
  items?: Item[];
  route?: string;
};

const CATEGORIES: Category[] = [
  {
    id: "aulas-interativas-cat",
    title: "Aulas Interativas",
    desc: "Catálogo de aulas com áudio narrado e conteúdos interativos",
    icon: Sparkles,
    route: "/admin-aulas-interativas",
    items: [
      {
        id: "aulas-interativas",
        label: "Aulas Interativas",
        icon: Sparkles,
        desc: "Aulas completas em HTML com narração e ilustrações",
        route: "/admin-aulas-interativas",
      },
    ],
  },
  {
    id: "push",
    title: "Notificações Push",
    desc: "Campanhas, agendamento e métricas",
    icon: Send,
    items: [
      {
        id: "admin-push",
        label: "Painel de Push",
        icon: BellRing,
        desc: "Compor, agendar, campanhas e métricas",
        route: "/admin-push",
      },
    ],
  },
  {
    id: "rotas",
    title: "Rotas do Aplicativo",
    desc: "Catálogo completo de rotas e sub-rotas em ordem alfabética",
    icon: RouteIcon,
    route: "/admin-rotas",
  },
  {
    id: "horus-exclusivo",
    title: "Horus",
    desc: "Assistente Horus no WhatsApp — instância, usuários e conversas",
    icon: Bird,
    route: "/admin-horus",
  },
  {
    id: "geracao-conteudo",
    title: "Geração de Conteúdo",
    desc: "IA, biblioteca e estudos",
    icon: Newspaper,
    items: [
      {
        id: "omniroute-admin",
        label: "OmniRoute (Gateway de IA)",
        icon: Sparkles,
        desc: "Central unificada de modelos e chaves de IA do aplicativo",
        route: "/admin-omniroute",
      },
      {
        id: "explicacao-lei",
        label: "Explicações Editar (IA)",
        icon: Lightbulb,
        desc: "Batch de explicações",
        route: "/explicacao-lei",
      },
    ],
  },
  {
    id: "utilitarios",
    title: "Utilitários",
    desc: "Funções restritas para admin",
    icon: FileSignature,
    items: [
      {
        id: "offline",
        label: "Modo Offline",
        icon: CloudDownload,
        desc: "Baixe leis e livros para usar sem internet",
        route: "/modo-offline",
      },
    ],
  },
];

const AdminFuncoes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const catParam = searchParams.get("cat") || (location.state as any)?.fromCat;
  const initialCat = useMemo(() => {
    if (!catParam) return null;
    return CATEGORIES.find((c) => c.id === catParam) || null;
  }, [catParam]);

  const [openCat, setOpenCat] = useState<Category | null>(initialCat);

  useEffect(() => {
    if (catParam) {
      const match = CATEGORIES.find((c) => c.id === catParam);
      if (match) setOpenCat(match);
    } else {
      setOpenCat(null);
    }
  }, [catParam]);

  useEffect(() => {
    const run = () => prefetchAllAdminRoutes();
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(run, { timeout: 600 });
      return () => {
        try {
          (window as any).cancelIdleCallback?.(id);
        } catch {}
      };
    }
    const t = globalThis.setTimeout(run, 250);
    return () => globalThis.clearTimeout(t);
  }, []);

  const handleClick = async (item: Item) => {
    if (item.route) {
      try {
        await prefetch(item.route);
      } catch {}
      navigate(item.route, { state: { fromCat: openCat?.id } });
    }
  };

  if (openCat) {
    return (
      <div className="min-h-dvh bg-background pb-8">
        <PageHeader
          title={openCat.title}
          onBack={() => {
            setSearchParams({});
            setOpenCat(null);
          }}
        />

        <div className="p-4">
          <p className="font-body text-[12px] text-muted-foreground mb-3 px-1">{openCat.desc}</p>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
            {(openCat.items || []).map((item) => {
              const Icon = item.icon;
              const disabled =
                !item.route && item.id !== "github-abrir" && item.id !== "crashlytics-test";
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  onPointerDown={() => prefetch(item.route)}
                  disabled={disabled}
                  className="w-full flex items-center gap-4 px-4 py-5 min-h-[84px] text-left hover:bg-secondary/60 active:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className="w-14 h-14 flex items-center justify-center shrink-0"
                    style={{ color: iconColor(item.id) }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-base font-semibold text-foreground truncate">
                      {item.label}
                    </div>
                    <div className="font-body text-[12px] text-muted-foreground truncate mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                  {!disabled && <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-8">
      <PageHeader title="Funções Admin" onBack={() => navigate("/")} />

      <div className="p-4">
        <AdminHojeCards />
        <p className="font-body text-[12px] text-muted-foreground mb-3 px-1">
          Toque em uma categoria para ver as funções disponíveis.
        </p>

        <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.route) {
                    void prefetch(cat.route).finally(() => navigate(cat.route!));
                    return;
                  }
                  const items = cat.items || [];
                  if (items.length === 1 && items[0].route) {
                    void prefetch(items[0].route).finally(() => navigate(items[0].route!));
                  } else {
                    setSearchParams({ cat: cat.id });
                    setOpenCat(cat);
                  }
                }}
                onPointerDown={() => {
                  if (cat.route) prefetch(cat.route);
                  (cat.items || []).forEach((i) => prefetch(i.route));
                }}
                className="w-full flex items-center gap-4 px-4 py-5 min-h-[84px] text-left hover:bg-secondary/60 active:bg-secondary transition-colors"
              >
                <div
                  className="w-14 h-14 flex items-center justify-center shrink-0"
                  style={{ color: iconColor(cat.id) }}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body text-base font-semibold text-foreground truncate">
                    {cat.title}
                  </div>
                  <div className="font-body text-[12px] text-muted-foreground truncate mt-0.5">
                    {cat.desc}{" "}
                    {cat.items && cat.items.length > 0
                      ? `· ${cat.items.length} ${cat.items.length === 1 ? "função" : "funções"}`
                      : ""}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminFuncoes;
