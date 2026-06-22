export const routeMeta = {
    "/": {
        title: "A cleaner marketplace front door for shoppers, sellers, and operators.",
        eyebrow: "Public Frontend",
        description: "LoopLot separates public shopping, seller workflows, and admin oversight into distinct pages with shared navigation.",
        area: "Public"
    },
    "/discover": {
        title: "Discovery is built for browsing, not backend work.",
        eyebrow: "Public Frontend",
        description: "Featured sellers, collections, and launch schedules stay on a shopper-facing page with clean handoff into live shopping.",
        area: "Public"
    },
    "/live": {
        title: "Live rooms feel bright, active, and focused on conversion.",
        eyebrow: "Public Frontend",
        description: "Shoppers get momentum signals and featured rooms without crossing into seller or admin controls.",
        area: "Public"
    },
    "/seller": {
        title: "Seller operations are isolated into a dedicated backend area.",
        eyebrow: "Seller Dashboard",
        description: "Inventory prep, wheel settings, show planning, and fulfillment stay behind seller access instead of mixing into the storefront.",
        area: "Seller"
    },
    "/admin": {
        title: "Marketplace oversight stays in its own restricted control room.",
        eyebrow: "Admin Suite",
        description: "Trust, moderation, disputes, and catalog health remain separate from both buyer and seller experiences.",
        area: "Admin"
    }
};
export const routeGroups = {
    public: [
        { path: "/", label: "Home" },
        { path: "/discover", label: "Discover" },
        { path: "/live", label: "Live" }
    ],
    seller: [{ path: "/seller", label: "Seller Dashboard" }],
    admin: [{ path: "/admin", label: "Admin Dashboard" }]
};
export const resolvePath = () => {
    if (typeof window === "undefined") {
        return "/";
    }
    const pathname = window.location.pathname;
    return pathname in routeMeta ? pathname : "/";
};
export const navigateTo = (href) => {
    if (typeof window === "undefined" || window.location.pathname === href) {
        return;
    }
    window.history.pushState({}, "", href);
    window.dispatchEvent(new Event("looplot:navigate"));
};
