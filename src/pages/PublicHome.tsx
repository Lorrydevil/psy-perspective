import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import type {
  AppAccount,
  AppSession,
  LoginCredentials,
  RegistrationInput
} from "../App";
import { routeGroups } from "../lib/router";

const highlights = [
  { label: "Live Auctions Tonight", value: "84" },
  { label: "Featured Sellers", value: "126" },
  { label: "Flash Buy-Nows", value: "312" },
  { label: "Avg Session Time", value: "19 min" }
];

const launchRail = [
  {
    title: "Luxury Revival",
    detail: "Vintage accessories with sudden-death bidding and host camera callouts.",
    meta: "Starts in 18 min"
  },
  {
    title: "Collector Break Room",
    detail: "Cards, comics, and sealed drops with bonus wheel wedges staged between lots.",
    meta: "420 lots queued"
  },
  {
    title: "Sneaker Sprint",
    detail: "Rapid-fire buy-now runs, size polling, and fast checkout on the live floor.",
    meta: "9.3k watching"
  }
 ] as const;

const featuredSellerStats = [
  { label: "Sell-through", value: "91%" },
  { label: "Avg lot close", value: "23 sec" },
  { label: "Repeat buyers", value: "68%" }
] as const;

const roleEntryPoints = [
  {
    title: "Guest / Buyer",
    detail: "Move through Home, Discover, and Live without touching seller or admin controls."
  },
  {
    title: "Seller",
    detail: "Jump into Seller Hub to prep wheel settings, stream details, and lot sequencing."
  },
  {
    title: "Admin",
    detail: "Review operations, trust, moderation, and seller health from a separate control room."
  }
] as const;

const quickAreaRoutes = [
  { title: "Public Home", to: "/", detail: "Reset to the storefront entry and account switcher." },
  { title: "Buyer Profile", to: "/buyer-profile", detail: "Manage buyer identity, shipping, payment, and saved bid defaults." },
  { title: "Discover", to: "/discover", detail: "Browse categories, launches, and featured sellers." },
  { title: "Live", to: "/live", detail: "Preview shopper-facing live rooms and momentum." },
  { title: "Seller Dashboard", to: "/seller", detail: "Enter the protected seller backend for stream prep." },
  { title: "Admin Dashboard", to: "/admin", detail: "Enter restricted moderation and marketplace controls." }
] as const;

const accessMatrix = [
  { role: "Guest / Buyer", access: "Home, Discover, Live" },
  { role: "Seller", access: "Home, Discover, Live, Seller Dashboard" },
  { role: "Admin", access: "All areas including Seller Dashboard and Admin Dashboard" }
] as const;

const shopperPromises = [
  "Clean public storefront with no seller control leakage.",
  "Direct access to discovery and live rooms for guests.",
  "Fast account switching for seeded buyer, seller, and admin sessions."
] as const;

const routeSplitSummary = [
  "Public routes handle browsing, discovery, and live viewing.",
  "Seller Hub handles stream setup, wheel settings, and bid listing prep.",
  "Admin Suite handles moderation, disputes, and marketplace operations."
] as const;

const livePreviewCards = [
  {
    seller: "Mila from House Archive",
    status: "Live now",
    title: "Louis Vuitton keepall start",
    bid: "$420",
    detail: "82 bids in the last two minutes with auto-extend active.",
    viewers: "2.4k watching"
  },
  {
    seller: "Rex from Break Vault",
    status: "Ending soon",
    title: "1998 Kobe insert chase lot",
    bid: "$168",
    detail: "Chat is surging after a rare parallel reveal.",
    viewers: "1.1k watching"
  },
  {
    seller: "Nori from Sole Circuit",
    status: "Buy now",
    title: "Jordan 4 Thunder size run",
    bid: "$245",
    detail: "Instant checkout enabled while the next auction is staged.",
    viewers: "860 watching"
  }
] as const;

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function PublicHome({
  accounts,
  authError,
  defaultAccounts,
  onClearAuthFeedback,
  onDeleteAccount,
  onLogin,
  onRegister,
  onUpdateAccount,
  onLogout,
  session
}: {
  accounts: AppAccount[];
  authError: string | null;
  defaultAccounts: AppAccount[];
  onClearAuthFeedback: () => void;
  onDeleteAccount: (email: string) => void;
  onLogin: (credentials: LoginCredentials) => boolean;
  onRegister: (input: RegistrationInput) => boolean;
  onUpdateAccount: (email: string, input: RegistrationInput) => boolean;
  onLogout: () => void;
  session: AppSession | null;
}) {
  const location = useLocation();
  const [email, setEmail] = useState(defaultAccounts[0]?.email ?? "");
  const [password, setPassword] = useState(defaultAccounts[0]?.password ?? "");
  const [accessMode, setAccessMode] = useState<"signin" | "register">("signin");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<"buyer" | "seller">("buyer");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editRole, setEditRole] = useState<"buyer" | "seller">("buyer");
  const registeredAccounts = accounts.filter((account) => account.source === "registered");

  useEffect(() => {
    const nextMessage =
      location.state && typeof location.state === "object" && "loginMessage" in location.state
        ? String(location.state.loginMessage)
        : null;

    setStatusMessage(nextMessage);
    if (nextMessage) {
      onClearAuthFeedback();
    }
  }, [location.state, onClearAuthFeedback]);

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const didLogin = onLogin({ email, password });

    if (!didLogin) {
      setStatusMessage(null);
    }
  }

  function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (registerPassword !== registerConfirmPassword) {
      onClearAuthFeedback();
      setStatusMessage("Passwords do not match yet.");
      return;
    }

    const didRegister = onRegister({
      email: registerEmail,
      name: registerName,
      password: registerPassword,
      role: registerRole
    });

    if (!didRegister) {
      setStatusMessage(null);
      return;
    }

    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterConfirmPassword("");
    setRegisterRole("buyer");
    setEmail(registerEmail.trim().toLowerCase());
    setPassword(registerPassword);
    setAccessMode("signin");
  }

  function formatCreatedAt(value: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(value));
  }

  function startEditingAccount(account: AppAccount) {
    onClearAuthFeedback();
    setEditingEmail(account.email);
    setEditName(account.name);
    setEditEmail(account.email);
    setEditPassword(account.password);
    setEditConfirmPassword(account.password);
    setEditRole(account.role === "seller" ? "seller" : "buyer");
    setStatusMessage(`Editing ${account.name}.`);
  }

  function resetAccountEditor() {
    setEditingEmail(null);
    setEditName("");
    setEditEmail("");
    setEditPassword("");
    setEditConfirmPassword("");
    setEditRole("buyer");
  }

  function submitAccountUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingEmail) {
      return;
    }

    if (editPassword !== editConfirmPassword) {
      onClearAuthFeedback();
      setStatusMessage("Updated passwords do not match yet.");
      return;
    }

    const didUpdate = onUpdateAccount(editingEmail, {
      email: editEmail,
      name: editName,
      password: editPassword,
      role: editRole
    });

    if (!didUpdate) {
      setStatusMessage(null);
      return;
    }

    setStatusMessage(`${editName.trim() || "Saved account"} was updated.`);
    setEmail(editEmail.trim().toLowerCase());
    setPassword(editPassword);
    resetAccountEditor();
  }

  return (
    <section className="page-grid">
      <article className="showcase-card span-8 marketplace-hero-card">
        <span className="section-label">Welcome Floor</span>
        <div className="marketplace-hero-layout">
          <div className="marketplace-hero-main">
            <div className="marketplace-hero-kicker">
              <span className="pill-label">Featured Seller</span>
              <span className="marketplace-hero-meta">House Archive is driving the floor tonight</span>
            </div>
            <h2>Live shopping worth opening right now.</h2>
            <p>
              Watch a featured seller with active bidding, clean checkout, and the next lots already queued so the
              storefront feels fast the moment shoppers land.
            </p>
            <div className="hero-cta-row marketplace-hero-actions">
              <Link className="button-primary" to="/live">
                Watch Live
              </Link>
              <Link className="button-secondary" to="/discover">
                Browse Auctions
              </Link>
              <Link className="button-secondary" to="/seller">
                Join Stream
              </Link>
            </div>
            <div className="marketplace-hero-inline-panels">
              <div className="marketplace-info-card">
                <span>Tonight's headline stream</span>
                <strong>Luxury Revival with Mila from House Archive</strong>
                <p>Designer accessories, sudden-death endings, and host callouts every few lots.</p>
              </div>
              <div className="marketplace-info-card">
                <span>Buyer flow</span>
                <strong>Discover a lot, join live, bid in seconds</strong>
                <p>The top section now prioritizes the main shopper decision instead of oversized filler UI.</p>
              </div>
            </div>
            <div className="marketplace-stat-strip">
              {highlights.map((item) => (
                <div className="marketplace-stat-chip" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="marketplace-hero-side">
            <div className="featured-stream-panel">
              <div className="featured-stream-top">
                <span className="pill-label">Featured Live</span>
                <span className="auction-status-pill">{livePreviewCards[0].status}</span>
              </div>
              <strong>{livePreviewCards[0].title}</strong>
              <p>{livePreviewCards[0].seller}</p>
              <p>{livePreviewCards[0].detail}</p>
              <div className="featured-stream-meta">
                <div>
                  <span>Current bid</span>
                  <strong>{livePreviewCards[0].bid}</strong>
                </div>
                <div>
                  <span>Audience</span>
                  <strong>{livePreviewCards[0].viewers}</strong>
                </div>
              </div>
              <Link className="button-primary featured-stream-button" to="/live">
                Join Stream
              </Link>
            </div>
            <div className="hero-support-card marketplace-seller-card">
              <span>Featured seller profile</span>
              <strong>Trusted luxury host with strong close rates</strong>
              <p>High-conviction buyers follow the stream because the pacing is tight and the lot staging stays clear.</p>
              <div className="marketplace-mini-stats">
                {featuredSellerStats.map((item) => (
                  <div className="marketplace-mini-stat" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="live-auction-grid">
          {livePreviewCards.map((item) => (
            <div className="auction-card" key={item.title}>
              <div className="auction-card-top">
                <div className="auction-seller">
                  <div className="seller-avatar">{item.seller.charAt(0)}</div>
                  <div>
                    <strong>{item.seller}</strong>
                    <span>{item.status}</span>
                  </div>
                </div>
                <span className="auction-status-pill">{item.status}</span>
              </div>
              <div className="auction-card-body">
                <span className="card-kicker">Current lot</span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
              <div className="auction-bid-row">
                <div>
                  <span>Current bid</span>
                  <strong>{item.bid}</strong>
                </div>
                <div>
                  <span>Audience</span>
                  <strong>{item.viewers}</strong>
                </div>
                <button className="button-primary" type="button">
                  Bid Now
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="feature-rail">
          {launchRail.map((item) => (
            <div className="feature-card" key={item.title}>
              <span>{item.meta}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-4 home-access-card">
        <span className="section-label">Account Access</span>
        <h2>{session ? `Signed in as ${session.name}` : "Get into the marketplace fast"}</h2>
        <p>
          {session
            ? `Your ${session.role} session controls which protected routes are available.`
            : "Use a buyer, seller, or admin account to test the live storefront and protected back-office areas without leaving the home page."}
        </p>
        <div className="auth-mode-toggle" aria-label="Account mode">
          <button
            className={`button-secondary auth-mode-button${accessMode === "signin" ? " is-active" : ""}`}
            onClick={() => {
              onClearAuthFeedback();
              setStatusMessage(null);
              setAccessMode("signin");
            }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`button-secondary auth-mode-button${accessMode === "register" ? " is-active" : ""}`}
            onClick={() => {
              onClearAuthFeedback();
              setStatusMessage(null);
              resetAccountEditor();
              setAccessMode("register");
            }}
            type="button"
          >
            Create Account
          </button>
        </div>

        {accessMode === "signin" ? (
          <form className="login-form" onSubmit={submitLogin}>
            <label className="field">
              <span>Email</span>
              <input
                onChange={(event) => {
                  onClearAuthFeedback();
                  setStatusMessage(null);
                  setEmail(event.target.value);
                }}
                type="email"
                value={email}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                onChange={(event) => {
                  onClearAuthFeedback();
                  setStatusMessage(null);
                  setPassword(event.target.value);
                }}
                type="password"
                value={password}
              />
            </label>
            <div className="nav-actions">
              <button className="button-primary" type="submit">
                Sign In
              </button>
              <Link className="button-secondary" to="/discover">
                Continue as Guest
              </Link>
              {session ? (
                <button className="button-secondary" onClick={onLogout} type="button">
                  Sign Out
                </button>
              ) : null}
            </div>
            {(statusMessage || authError) && (
              <p className={`feedback${authError ? " is-error" : ""}`}>{authError ?? statusMessage}</p>
            )}
          </form>
        ) : (
          <form className="login-form" onSubmit={submitRegistration}>
            <label className="field">
              <span>Name</span>
              <input
                onChange={(event) => {
                  onClearAuthFeedback();
                  setStatusMessage(null);
                  setRegisterName(event.target.value);
                }}
                type="text"
                value={registerName}
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                onChange={(event) => {
                  onClearAuthFeedback();
                  setStatusMessage(null);
                  setRegisterEmail(event.target.value);
                }}
                type="email"
                value={registerEmail}
              />
            </label>
            <label className="field">
              <span>Account type</span>
              <select
                onChange={(event) => {
                  onClearAuthFeedback();
                  setStatusMessage(null);
                  setRegisterRole(event.target.value as "buyer" | "seller");
                }}
                value={registerRole}
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </label>
            <label className="field">
              <span>Password</span>
              <input
                onChange={(event) => {
                  onClearAuthFeedback();
                  setStatusMessage(null);
                  setRegisterPassword(event.target.value);
                }}
                type="password"
                value={registerPassword}
              />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input
                onChange={(event) => {
                  onClearAuthFeedback();
                  setStatusMessage(null);
                  setRegisterConfirmPassword(event.target.value);
                }}
                type="password"
                value={registerConfirmPassword}
              />
            </label>
            <div className="nav-actions">
              <button className="button-primary" type="submit">
                Create Account
              </button>
              <button
                className="button-secondary"
                onClick={() => {
                  onClearAuthFeedback();
                  setStatusMessage(null);
                  setAccessMode("signin");
                }}
                type="button"
              >
                Back to Sign In
              </button>
            </div>
            <p className="feedback">New buyer and seller accounts are stored in this browser so the app stays testable between refreshes.</p>
            {(statusMessage || authError) && (
              <p className={`feedback${authError ? " is-error" : ""}`}>{authError ?? statusMessage}</p>
            )}
          </form>
        )}
        <div className="compact-grid compact-grid-1">
          {roleEntryPoints.map((item) => (
            <div className="insight-panel" key={item.title}>
              <span>{item.title}</span>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Seeded Credentials</span>
        <div className="card-grid-3">
          {defaultAccounts.map((account) => (
            <button
              className="list-card credential-card"
              key={account.email}
              onClick={() => {
                setAccessMode("signin");
                setEmail(account.email);
                setPassword(account.password);
                setStatusMessage(`Loaded ${account.role} account for ${account.name}.`);
              }}
              type="button"
            >
              <strong>{account.name}</strong>
              <p>{account.email}</p>
              <p>Password: {account.password}</p>
              <p>Role: {account.role}</p>
            </button>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Saved Accounts</span>
        <div className="card-grid-3">
          {registeredAccounts.length > 0 ? (
            registeredAccounts.map((account) => (
              <div className="list-card credential-card" key={`${account.source}-${account.email}`}>
                <strong>{account.name}</strong>
                <p>{account.email}</p>
                <p>Role: {account.role}</p>
                <p className="credential-card-meta">Saved {formatCreatedAt(account.createdAt)}</p>
                <div className="credential-card-actions">
                  <button
                    className="button-primary"
                    onClick={() => {
                      setAccessMode("signin");
                      setEmail(account.email);
                      setPassword(account.password);
                      setStatusMessage(`Loaded saved ${account.role} account for ${account.name}.`);
                    }}
                    type="button"
                  >
                    Use Account
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => startEditingAccount(account)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => {
                      if (editingEmail === account.email) {
                        resetAccountEditor();
                      }
                      onDeleteAccount(account.email);
                      setStatusMessage(`${account.name} was removed from saved accounts.`);
                    }}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
                {editingEmail === account.email ? (
                  <form className="login-form credential-editor" onSubmit={submitAccountUpdate}>
                    <label className="field">
                      <span>Name</span>
                      <input onChange={(event) => setEditName(event.target.value)} type="text" value={editName} />
                    </label>
                    <label className="field">
                      <span>Email</span>
                      <input onChange={(event) => setEditEmail(event.target.value)} type="email" value={editEmail} />
                    </label>
                    <label className="field">
                      <span>Account type</span>
                      <select onChange={(event) => setEditRole(event.target.value as "buyer" | "seller")} value={editRole}>
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Password</span>
                      <input
                        onChange={(event) => setEditPassword(event.target.value)}
                        type="password"
                        value={editPassword}
                      />
                    </label>
                    <label className="field">
                      <span>Confirm password</span>
                      <input
                        onChange={(event) => setEditConfirmPassword(event.target.value)}
                        type="password"
                        value={editConfirmPassword}
                      />
                    </label>
                    <div className="nav-actions">
                      <button className="button-primary" type="submit">
                        Save Changes
                      </button>
                      <button
                        className="button-secondary"
                        onClick={resetAccountEditor}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            ))
          ) : (
            <div className="list-card">
              <strong>No custom accounts yet</strong>
              <p>Create a buyer or seller account above to populate this directory and test the app with your own users.</p>
            </div>
          )}
        </div>
      </article>

      <article className="page-card span-8">
        <span className="section-label">Shopper Promise</span>
        <div className="card-grid-3">
          {shopperPromises.map((item) => (
            <div className="list-card" key={item}>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-4">
        <span className="section-label">Route Roles</span>
        <div className="stack">
          {roleEntryPoints.map((item) => (
            <div className="list-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Area Map</span>
        <div className="card-grid-4">
          <div className="list-card">
            <strong>Public Area</strong>
            <p>Home, Discover, and Live are open routes intended for shoppers and guest traffic.</p>
          </div>
          <div className="list-card">
            <strong>Seller Area</strong>
            <p>Seller Hub contains wheel settings, live stream setup, product listing management, and go-live controls.</p>
          </div>
          <div className="list-card">
            <strong>Admin Area</strong>
            <p>Admin pages stay restricted to moderation, trust, catalog quality, and marketplace health.</p>
          </div>
          <div className="list-card">
            <strong>Shared Navigation</strong>
            <p>The top navigation exposes every area while route guards keep protected spaces separated.</p>
          </div>
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Full Area Navigation</span>
        <div className="card-grid-4">
          {quickAreaRoutes.map((item) => (
            <Link className="list-card" key={item.to} to={item.to}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </Link>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Access Matrix</span>
        <div className="card-grid-3">
          {accessMatrix.map((item) => (
            <div className="list-card" key={item.role}>
              <strong>{item.role}</strong>
              <p>{item.access}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Route Split Summary</span>
        <div className="card-grid-3">
          {routeSplitSummary.map((item) => (
            <div className="list-card" key={item}>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-8">
        <span className="section-label">Navigation Coverage</span>
        <div className="card-grid-3">
          <div className="list-card">
            <strong>Public Routes</strong>
            <p>{routeGroups.public.map((route) => route.label).join(" | ")}</p>
          </div>
          <div className="list-card">
            <strong>Seller Routes</strong>
            <p>{routeGroups.seller.map((route) => route.label).join(" | ")}</p>
          </div>
          <div className="list-card">
            <strong>Admin Routes</strong>
            <p>{routeGroups.admin.map((route) => route.label).join(" | ")}</p>
          </div>
        </div>
      </article>

      <article className="page-card span-4">
        <span className="section-label">Quick Navigation</span>
        <div className="stack">
          <Link className="list-card" to="/discover">
            <strong>Open Discover</strong>
            <p>Browse buyer-facing categories and launches.</p>
          </Link>
          <Link className="list-card" to="/live">
            <strong>Open Live</strong>
            <p>See the public live shopping floor.</p>
          </Link>
          <Link className="list-card" to="/seller">
            <strong>Open Seller Dashboard</strong>
            <p>Protected workspace for seller stream setup, wheel settings, and product listings prepared for live bidding.</p>
          </Link>
          <Link className="list-card" to="/admin">
            <strong>Open Admin Dashboard</strong>
            <p>Restricted marketplace controls and oversight.</p>
          </Link>
        </div>
      </article>
    </section>
  );
}

