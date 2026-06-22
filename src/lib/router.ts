export type RouteMeta = {
  title: string;
  eyebrow: string;
  description: string;
  area: "Public" | "Seller" | "Admin";
};

export const routeMeta: Record<string, RouteMeta> = {
  "/": {
    title: "A cleaner marketplace front door for shoppers, sellers, and operators.",
    eyebrow: "Public Frontend",
    description: "LoopLot separates public shopping, seller workflows, and admin oversight into distinct pages with shared navigation.",
    area: "Public"
  },
  "/buyer-profile": {
    title: "Buyer identity, bidding defaults, and checkout readiness live on their own page.",
    eyebrow: "Buyer Profile",
    description: "Saved buyer preferences, shipping details, payment setup, and recent orders now live in a dedicated shopper-facing workspace.",
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
  "/seller/postal-service": {
    title: "Seller postal setup now lives on its own protected configuration page.",
    eyebrow: "Seller Postal Setup",
    description: "Carrier defaults, warehouse details, and return rules are saved in a dedicated seller-only fulfillment workspace.",
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
    { path: "/buyer-profile", label: "Buyer Profile" },
    { path: "/discover", label: "Discover" },
    { path: "/live", label: "Live" }
  ],
  seller: [
    { path: "/seller", label: "Seller Dashboard" },
    { path: "/seller/postal-service", label: "Postal Setup" }
  ],
  admin: [{ path: "/admin", label: "Admin Dashboard" }]
} as const;

export type RoutePath = keyof typeof routeMeta;

export const resolvePath = (): RoutePath => {
  if (typeof window === "undefined") {
    return "/";
  }

  const pathname = window.location.pathname as RoutePath;
  return pathname in routeMeta ? pathname : "/";
};

export const navigateTo = (href: RoutePath | string) => {
  if (typeof window === "undefined" || window.location.pathname === href) {
    return;
  }

  window.history.pushState({}, "", href);
  window.dispatchEvent(new Event("looplot:navigate"));
};
