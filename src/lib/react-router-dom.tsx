import {
  Children,
  type MouseEvent,
  type PropsWithChildren,
  type ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type LocationValue = {
  pathname: string;
  state?: unknown;
};

type RouterContextValue = {
  location: LocationValue;
  navigate: (to: string, replace?: boolean, state?: unknown) => void;
};

type RouteProps = {
  path: string;
  element: ReactElement;
};

type LinkProps = PropsWithChildren<{
  className?: string | ((state: { isActive: boolean }) => string);
  replace?: boolean;
  state?: unknown;
  to: string;
}>;

const RouterContext = createContext<RouterContextValue | null>(null);

const normalizePath = (path: string) => {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
};

const useRouter = () => {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error("Router context is not available.");
  }

  return context;
};

export function BrowserRouter({ children }: PropsWithChildren) {
  const [location, setLocation] = useState<LocationValue>(() => ({
    pathname: window.location.pathname || "/",
    state: window.history.state?.usr
  }));

  useEffect(() => {
    const syncPath = () =>
      setLocation({
        pathname: window.location.pathname || "/",
        state: window.history.state?.usr
      });

    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  const value = useMemo<RouterContextValue>(
    () => ({
      location,
      navigate: (to, replace = false, state) => {
        const nextPath = normalizePath(to);
        const nextState = { usr: state };

        if (nextPath === location.pathname && state === location.state) {
          return;
        }

        if (replace) {
          window.history.replaceState(nextState, "", nextPath);
        } else {
          window.history.pushState(nextState, "", nextPath);
        }

        setLocation({ pathname: nextPath, state });
      }
    }),
    [location]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  return useRouter().location;
}

export function Link({ children, className, replace = false, state, to }: LinkProps) {
  const { location, navigate } = useRouter();
  const isActive = location.pathname === normalizePath(to);
  const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;

  return (
    <a
      className={resolvedClassName}
      href={to}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey
        ) {
          return;
        }

        event.preventDefault();
        navigate(to, replace, state);
      }}
    >
      {children}
    </a>
  );
}

export function NavLink({ children, className, replace = false, state, to }: LinkProps) {
  return (
    <Link className={className} replace={replace} state={state} to={to}>
      {children}
    </Link>
  );
}

export function Navigate({ replace = false, state, to }: { replace?: boolean; state?: unknown; to: string }) {
  const { navigate } = useRouter();

  useEffect(() => {
    navigate(to, replace, state);
  }, [navigate, replace, state, to]);

  return null;
}

export function useNavigate() {
  return useRouter().navigate;
}

export function Route(_props: RouteProps) {
  return null;
}

export function Routes({ children }: PropsWithChildren) {
  const { location } = useRouter();
  const routeElements = Children.toArray(children) as ReactElement<RouteProps>[];

  const matchedRoute =
    routeElements.find((child) => child.props.path === location.pathname) ??
    routeElements.find((child) => child.props.path === "*");

  return matchedRoute?.props.element ?? null;
}
