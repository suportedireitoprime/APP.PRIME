import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { AdminHojeCards } from '@/components/admin/AdminHojeCards';
import {
  ADMIN_CATEGORIES,
  adminIconColor,
  prefetchAdminRoute,
  prefetchAllAdminRoutes,
  type AdminFuncoesCategory,
  type AdminFuncoesItem,
} from '@/lib/adminFuncoesCatalog';

const AdminFuncoes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const catParam = searchParams.get('cat') || (location.state as { fromCat?: string } | null)?.fromCat;
  const initialCat = useMemo(() => {
    if (!catParam) return null;
    return ADMIN_CATEGORIES.find((c) => c.id === catParam) || null;
  }, [catParam]);

  const [openCat, setOpenCat] = useState<AdminFuncoesCategory | null>(initialCat);

  useEffect(() => {
    if (catParam) {
      const match = ADMIN_CATEGORIES.find((c) => c.id === catParam);
      if (match) setOpenCat(match);
    } else {
      setOpenCat(null);
    }
  }, [catParam]);

  useEffect(() => {
    const run = () => prefetchAllAdminRoutes();
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = (window as unknown as { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number }).requestIdleCallback(run, { timeout: 600 });
      return () => {
        try {
          (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
        } catch {}
      };
    }
    const t = globalThis.setTimeout(run, 250);
    return () => globalThis.clearTimeout(t);
  }, []);

  const handleClick = async (item: AdminFuncoesItem) => {
    if (item.route) {
      try {
        await prefetchAdminRoute(item.route);
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
                !item.route && item.id !== 'github-abrir' && item.id !== 'crashlytics-test';
              return (
                <button
                  key={item.id}
                  onClick={() => void handleClick(item)}
                  onPointerDown={() => void prefetchAdminRoute(item.route)}
                  disabled={disabled}
                  className="w-full flex items-center gap-4 px-4 py-5 min-h-[84px] text-left hover:bg-secondary/60 active:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className="w-14 h-14 flex items-center justify-center shrink-0"
                    style={{ color: adminIconColor(item.id) }}
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
      <PageHeader title="Funções Admin" onBack={() => navigate('/')} />

      <div className="p-4">
        <AdminHojeCards />
        <p className="font-body text-[12px] text-muted-foreground mb-3 px-1">
          Toque em uma categoria para ver as funções disponíveis.
        </p>

        <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
          {ADMIN_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.route) {
                    void prefetchAdminRoute(cat.route).finally(() => navigate(cat.route!));
                    return;
                  }
                  const items = cat.items || [];
                  if (items.length === 1 && items[0].route) {
                    void prefetchAdminRoute(items[0].route).finally(() => navigate(items[0].route!));
                  } else {
                    setSearchParams({ cat: cat.id });
                    setOpenCat(cat);
                  }
                }}
                onPointerDown={() => {
                  if (cat.route) void prefetchAdminRoute(cat.route);
                  (cat.items || []).forEach((i) => void prefetchAdminRoute(i.route));
                }}
                className="w-full flex items-center gap-4 px-4 py-5 min-h-[84px] text-left hover:bg-secondary/60 active:bg-secondary transition-colors"
              >
                <div
                  className="w-14 h-14 flex items-center justify-center shrink-0"
                  style={{ color: adminIconColor(cat.id) }}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body text-base font-semibold text-foreground truncate">
                    {cat.title}
                  </div>
                  <div className="font-body text-[12px] text-muted-foreground truncate mt-0.5">
                    {cat.desc}{' '}
                    {cat.items && cat.items.length > 0
                      ? `· ${cat.items.length} ${cat.items.length === 1 ? 'função' : 'funções'}`
                      : ''}
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
