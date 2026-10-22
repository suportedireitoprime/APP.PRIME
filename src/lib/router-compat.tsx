// Compatibility layer: exposes the react-router-dom API used by the imported
// Direito Prime code, implemented on top of TanStack Router's history.
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  type AnchorHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";

type To = string | { pathname?: string; search?: string; hash?: string };
export type NavigateOptions = { replace?: boolean; state?: unknown };
export type NavigateFunction = {
  (to: To, opts?: NavigateOptions): void;
  (delta: number): void;
};
export interface Location {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
  key: string;
}

const ParamsCtx = createContext<Record<string, string>>({});
const OutletCtx = createContext<ReactNode>(null);
const OutletDataCtx = createContext<unknown>(undefined);

function toHref(to: To): string {
  if (typeof to === "string") return to;
  return `${to.pathname ?? window.location.pathname}${to.search ?? ""}${to.hash ?? ""}`;
}

function resolve(href: string, base: string): string {
  if (href.startsWith("/") || /^[a-z]+:/i.test(href) || href.startsWith("?") || href.startsWith("#")) {
    if (href.startsWith("?") || href.startsWith("#")) return base + href;
    return href;
  }
  const parts = base.split("/").filter(Boolean);
  for (const seg of href.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg && seg !== ".") parts.push(seg);
  }
  return "/" + parts.join("/");
}

export function useLocation(): Location {
  const loc = useRouterState({ select: (s) => s.location });
  return useMemo(
    () => ({
      pathname: loc.pathname,
      search: loc.searchStr ?? "",
      hash: loc.hash ? `#${loc.hash}` : "",
      state: (loc.state as any)?.__rr ?? null,
      key: (loc.state as any)?.key ?? loc.href,
    }),
    [loc],
  );
}

export function useNavigate(): NavigateFunction {
  const router = useRouter();
  return useMemo(() => {
    const fn = (to: To | number, opts?: NavigateOptions) => {
      if (typeof to === "number") {
        router.history.go(to);
        return;
      }
      const href = resolve(toHref(to), window.location.pathname);
      if (/^https?:/i.test(href)) {
        window.location.href = href;
        return;
      }
      const state = { __rr: opts?.state ?? null } as any;
      if (opts?.replace) router.history.replace(href, state);
      else router.history.push(href, state);
    };
    return fn as NavigateFunction;
  }, [router]);
}

export function useNavigationType(): "POP" | "PUSH" | "REPLACE" {
  return "PUSH";
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string>>(): T {
  return useContext(ParamsCtx) as T;
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string> | string | ((p: URLSearchParams) => URLSearchParams | Record<string, string>), opts?: NavigateOptions) => void,
] {
  const loc = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const set = (next: any, opts?: NavigateOptions) => {
    const v = typeof next === "function" ? next(new URLSearchParams(loc.search)) : next;
    const sp = new URLSearchParams(v);
    const qs = sp.toString();
    navigate(`${loc.pathname}${qs ? `?${qs}` : ""}${loc.hash}`, opts);
  };
  return [params, set];
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
  replace?: boolean;
  state?: unknown;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state, onClick, target, ...rest },
  ref,
) {
  const navigate = useNavigate();
  const href = toHref(to);
  return (
    <a
      ref={ref}
      href={href}
      target={target}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || target === "_blank") return;
        e.preventDefault();
        navigate(href, { replace, state } as NavigateOptions);
      }}
    />
  );
});

type NavLinkProps = Omit<LinkProps, "className" | "style" | "children"> & {
  end?: boolean;
  className?: string | ((s: { isActive: boolean; isPending: boolean }) => string);
  style?: any;
  children?: ReactNode | ((s: { isActive: boolean; isPending: boolean }) => ReactNode);
};
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { className, style, children, end, ...rest },
  ref,
) {
  const { pathname } = useLocation();
  const target = resolve(toHref(rest.to), pathname).split("?")[0]!;
  const isActive = end ? pathname === target : pathname === target || pathname.startsWith(target + "/");
  const s = { isActive, isPending: false };
  return (
    <Link
      ref={ref}
      {...rest}
      className={typeof className === "function" ? className(s) : className}
      style={typeof style === "function" ? style(s) : style}
    >
      {typeof children === "function" ? children(s) : children}
    </Link>
  );
});

export function Navigate({ to, replace, state }: { to: To; replace?: boolean; state?: unknown }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state } as NavigateOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function Outlet({ context }: { context?: unknown }) {
  const el = useContext(OutletCtx);
  return <OutletDataCtx.Provider value={context}>{el}</OutletDataCtx.Provider>;
}
export function useOutletContext<T = unknown>(): T {
  return useContext(OutletDataCtx) as T;
}

type RouteProps = { path?: string; index?: boolean; element?: ReactNode; children?: ReactNode };
export function Route(_props: RouteProps): ReactElement | null {
  return null;
}

type RouteDef = { path: string; element: ReactNode; children: RouteDef[]; index: boolean };

function collect(children: ReactNode, parent = ""): RouteDef[] {
  const out: RouteDef[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const p = child.props as RouteProps & { children?: ReactNode };
    if (child.type !== Route) {
      // Fragments and wrappers
      if (p?.children) out.push(...collect(p.children, parent));
      return;
    }
    const raw = p.path ?? "";
    const full = raw.startsWith("/") ? raw : `${parent.replace(/\/$/, "")}/${raw}`;
    out.push({
      path: p.index ? parent || "/" : full.replace(/\/+/g, "/"),
      element: p.element ?? null,
      index: !!p.index,
      children: p.children ? collect(p.children, full) : [],
    });
  });
  return out;
}

function match(pattern: string, pathname: string, allowPrefix: boolean): Record<string, string> | null {
  const pp = pattern.split("/").filter(Boolean);
  const sp = pathname.split("/").filter(Boolean).map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    const seg = pp[i]!;
    if (seg === "*") {
      params["*"] = sp.slice(i).join("/");
      return params;
    }
    const v = sp[i];
    const optional = seg.endsWith("?");
    const name = optional ? seg.slice(0, -1) : seg;
    if (v === undefined) {
      if (optional) continue;
      return null;
    }
    if (name.startsWith(":")) params[name.slice(1)] = v;
    else if (name.toLowerCase() !== v.toLowerCase()) return null;
  }
  if (sp.length > pp.length && !allowPrefix) return null;
  return params;
}

function score(path: string) {
  const segs = path.split("/").filter(Boolean);
  if (segs.length === 0) return 5; // exact "/" beats the catch-all
  return segs.reduce((s, seg) => s + (seg === "*" ? -1000 : seg.startsWith(":") ? 3 : 10), 0);
}

function render(defs: RouteDef[], pathname: string, inherited: Record<string, string>): ReactNode {
  const sorted = [...defs].sort((a, b) => score(b.path) - score(a.path));
  for (const d of sorted) {
    if (d.children.length) {
      const pm = match(d.path, pathname, true);
      if (!pm) continue;
      const inner = render(d.children, pathname, { ...inherited, ...pm });
      if (inner === null && match(d.path, pathname, false) === null) continue;
      return (
        <ParamsCtx.Provider value={{ ...inherited, ...pm }}>
          <OutletCtx.Provider value={inner}>{d.element ?? <Outlet />}</OutletCtx.Provider>
        </ParamsCtx.Provider>
      );
    }
    const m = match(d.path, pathname, false);
    if (m) return <ParamsCtx.Provider value={{ ...inherited, ...m }}>{d.element}</ParamsCtx.Provider>;
  }
  return null;
}

export function Routes({ children, location }: { children?: ReactNode; location?: Partial<Location> | string }) {
  const current = useLocation();
  const pathname = typeof location === "string" ? location : (location?.pathname ?? current.pathname);
  const inherited = useParams();
  const defs = useMemo(() => collect(children), [children]);
  return <>{render(defs, pathname, inherited)}</>;
}

export function BrowserRouter({ children }: { children?: ReactNode; [k: string]: unknown }) {
  return <>{children}</>;
}
export const HashRouter = BrowserRouter;
export const MemoryRouter = BrowserRouter;

export function useMatch(pattern: string) {
  const { pathname } = useLocation();
  const params = match(pattern, pathname, false);
  return params ? { params, pathname, pattern: { path: pattern } } : null;
}
export function matchPath(pattern: string | { path: string; end?: boolean }, pathname: string) {
  const p = typeof pattern === "string" ? pattern : pattern.path;
  const end = typeof pattern === "string" ? true : pattern.end !== false;
  const params = match(p, pathname, !end);
  return params ? { params, pathname, pattern: { path: p } } : null;
}
export function useInRouterContext() {
  return true;
}
export function useBlocker() {
  return { state: "unblocked" as const, proceed: () => {}, reset: () => {} };
}
export function createSearchParams(init?: any) {
  return new URLSearchParams(init);
}
