import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cn } from './utils';

interface RouteState {
  path: string;
  params: Record<string, string>;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouteState | undefined>(undefined);

function parseHash(): { path: string; params: Record<string, string> } {
  const hash = window.location.hash.slice(1) || '/';
  const [path, query] = hash.split('?');
  const params: Record<string, string> = {};
  if (query) {
    new URLSearchParams(query).forEach((v, k) => (params[k] = v));
  }
  return { path: path || '/', params };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(parseHash());

  useEffect(() => {
    const onHash = () => setState(parseHash());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) window.location.hash = '#/';
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = '#' + path;
    window.scrollTo({ top: 0 });
  };

  return (
    <RouterContext.Provider value={{ ...state, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRouter(): RouteState {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { navigate } = useRouter();
  return (
    <a
      href={'#' + to}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
        onClick?.();
      }}
      className={cn(className)}
    >
      {children}
    </a>
  );
}
