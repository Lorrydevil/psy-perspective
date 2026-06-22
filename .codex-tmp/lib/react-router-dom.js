import { jsx as _jsx } from "react/jsx-runtime";
import { Children, createContext, useContext, useEffect, useMemo, useState } from "react";
const RouterContext = createContext(null);
const normalizePath = (path) => {
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
export function BrowserRouter({ children }) {
    const [location, setLocation] = useState(() => ({
        pathname: window.location.pathname || "/",
        state: window.history.state?.usr
    }));
    useEffect(() => {
        const syncPath = () => setLocation({
            pathname: window.location.pathname || "/",
            state: window.history.state?.usr
        });
        window.addEventListener("popstate", syncPath);
        return () => window.removeEventListener("popstate", syncPath);
    }, []);
    const value = useMemo(() => ({
        location,
        navigate: (to, replace = false, state) => {
            const nextPath = normalizePath(to);
            const nextState = { usr: state };
            if (nextPath === location.pathname && state === location.state) {
                return;
            }
            if (replace) {
                window.history.replaceState(nextState, "", nextPath);
            }
            else {
                window.history.pushState(nextState, "", nextPath);
            }
            setLocation({ pathname: nextPath, state });
        }
    }), [location]);
    return _jsx(RouterContext.Provider, { value: value, children: children });
}
export function useLocation() {
    return useRouter().location;
}
export function Link({ children, className, replace = false, state, to }) {
    const { location, navigate } = useRouter();
    const isActive = location.pathname === normalizePath(to);
    const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;
    return (_jsx("a", { className: resolvedClassName, href: to, onClick: (event) => {
            if (event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.altKey ||
                event.ctrlKey ||
                event.shiftKey) {
                return;
            }
            event.preventDefault();
            navigate(to, replace, state);
        }, children: children }));
}
export function NavLink({ children, className, replace = false, state, to }) {
    return (_jsx(Link, { className: className, replace: replace, state: state, to: to, children: children }));
}
export function Navigate({ replace = false, state, to }) {
    const { navigate } = useRouter();
    useEffect(() => {
        navigate(to, replace, state);
    }, [navigate, replace, state, to]);
    return null;
}
export function useNavigate() {
    return useRouter().navigate;
}
export function Route(_props) {
    return null;
}
export function Routes({ children }) {
    const { location } = useRouter();
    const routeElements = Children.toArray(children);
    const matchedRoute = routeElements.find((child) => child.props.path === location.pathname) ??
        routeElements.find((child) => child.props.path === "*");
    return matchedRoute?.props.element ?? null;
}
