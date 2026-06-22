import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type {
  AppSession,
  BuyerAccountSettings,
  BuyerCategoryPreference,
  BuyerSettingsInput,
  BuyerTransaction
} from "../App";

const buyerPreferenceCategories: BuyerCategoryPreference[] = [
  "Luxury",
  "Trading Cards",
  "Sneakers",
  "Collectibles",
  "Accessories",
  "Beauty"
];

const buyerShippingRegions: BuyerAccountSettings["shippingRegion"][] = [
  "Domestic only",
  "Domestic + international",
  "Local pickup preferred"
];

const buyerBidPresets: BuyerAccountSettings["bidPreset"][] = ["$10", "$25", "$50", "$100"];

const buyerAlertLevels: BuyerAccountSettings["alerts"][] = [
  "All live alerts",
  "Watched rooms only",
  "Minimal alerts"
];

const buyerAudioModes: BuyerAccountSettings["streamAudio"][] = ["Autoplay muted", "Autoplay with sound"];

const buyerWatchlistModes: BuyerAccountSettings["watchlistMode"][] = [
  "Manual room saves",
  "Watchlist alerts priority"
];

const buyerCheckoutStates: BuyerAccountSettings["checkoutReadiness"][] = [
  "Ready to buy",
  "Review shipping and payment"
];

const buyerPaymentMethods: BuyerAccountSettings["paymentMethod"][] = ["Visa", "Mastercard", "PayPal", "Afterpay"];

const profileLinks = [
  { title: "Return Home", to: "/", detail: "Switch accounts or use the storefront entry flow." },
  { title: "Browse Discover", to: "/discover", detail: "Open category-led buyer discovery." },
  { title: "Watch Live", to: "/live", detail: "Use saved bid defaults inside active rooms." }
] as const;

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatExpiryInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatSummaryValue(value: string, fallback = "Not set") {
  return value.trim() || fallback;
}

function buildBuyerSettingsValidationMessage(input: BuyerSettingsInput) {
  if (!input.profileLabel.trim()) {
    return "Enter a buyer profile label before saving settings.";
  }

  if (!input.contactEmail.trim() || !isValidEmailAddress(input.contactEmail.trim())) {
    return "Enter a valid contact email for the buyer account.";
  }

  if (!input.addressLine1.trim() || !input.city.trim() || !input.postalCode.trim() || !input.country.trim()) {
    return "Complete the shipping address before saving buyer settings.";
  }

  if (!/^\d{4}$/.test(input.paymentLast4.trim())) {
    return "Enter the last four digits for the buyer payment method.";
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(input.paymentExpiry.trim())) {
    return "Use MM/YY for the buyer payment expiry.";
  }

  if (!input.billingPostalCode.trim()) {
    return "Enter the billing postal code for the buyer payment profile.";
  }

  return null;
}

function calculateProfileCompletion(settings: BuyerAccountSettings | null) {
  if (!settings) {
    return 0;
  }

  const fields = [
    settings.profileLabel,
    settings.contactEmail,
    settings.phoneNumber,
    settings.addressLine1,
    settings.city,
    settings.stateRegion,
    settings.postalCode,
    settings.country,
    settings.paymentLast4,
    settings.paymentExpiry,
    settings.billingPostalCode
  ];
  const completed = fields.filter((field) => field.trim().length > 0).length;

  return Math.round((completed / fields.length) * 100);
}

function currencyToNumber(value: string) {
  const numericValue = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function buildIdentityInitials(session: AppSession | null, settings: BuyerAccountSettings | null) {
  const label = settings?.profileLabel || session?.name || "Buyer";

  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("");
}

function buildReadinessCards(settings: BuyerAccountSettings | null, completion: number, transactionCount: number) {
  if (!settings) {
    return [
      { label: "Profile", value: "Buyer only", detail: "Sign in with a buyer account to start profile setup." },
      { label: "Checkout", value: "Buyer only", detail: "Payment and shipping readiness appear after buyer sign-in." },
      { label: "Order history", value: "0", detail: "Recent buyer activity lands here once the account is active." }
    ];
  }

  return [
    {
      label: "Profile completion",
      value: `${completion}%`,
      detail: "Identity, shipping, and payment details are tracked together."
    },
    {
      label: "Checkout posture",
      value: settings.checkoutReadiness,
      detail: `Default payment is ${settings.paymentMethod} ending in ${settings.paymentLast4}.`
    },
    {
      label: "Recent orders",
      value: String(transactionCount),
      detail: `Saved bid jump is ${settings.bidPreset} with ${settings.alerts.toLowerCase()}.`
    }
  ];
}

function buildSignalCards(settings: BuyerAccountSettings | null) {
  if (!settings) {
    return [
      { label: "Favorite lane", value: "Buyer only" },
      { label: "Alerts", value: "Buyer only" },
      { label: "Watchlist", value: "Buyer only" },
      { label: "Audio", value: "Buyer only" }
    ];
  }

  return [
    { label: "Favorite lane", value: settings.favoriteCategory },
    { label: "Alerts", value: settings.alerts },
    { label: "Watchlist", value: settings.watchlistMode },
    { label: "Audio", value: settings.streamAudio }
  ];
}

function buildActivityCards(transactions: BuyerTransaction[]) {
  return transactions.slice(0, 3).map((transaction) => ({
    id: transaction.id,
    label: transaction.date,
    title: transaction.title,
    detail: transaction.detail,
    value: transaction.amount,
    status: transaction.status
  }));
}

export default function BuyerProfile({
  currentBuyerSettings,
  onResetBuyerSettings,
  onSaveBuyerSettings,
  session
}: {
  currentBuyerSettings: BuyerAccountSettings | null;
  onResetBuyerSettings: () => boolean;
  onSaveBuyerSettings: (input: BuyerSettingsInput) => boolean;
  session: AppSession | null;
}) {
  const [buyerProfileLabel, setBuyerProfileLabel] = useState("");
  const [buyerFavoriteCategory, setBuyerFavoriteCategory] = useState<BuyerCategoryPreference>("Luxury");
  const [buyerShippingRegion, setBuyerShippingRegion] = useState<BuyerAccountSettings["shippingRegion"]>(
    "Domestic + international"
  );
  const [buyerBidPreset, setBuyerBidPreset] = useState<BuyerAccountSettings["bidPreset"]>("$25");
  const [buyerAlerts, setBuyerAlerts] = useState<BuyerAccountSettings["alerts"]>("Watched rooms only");
  const [buyerStreamAudio, setBuyerStreamAudio] = useState<BuyerAccountSettings["streamAudio"]>("Autoplay muted");
  const [buyerWatchlistMode, setBuyerWatchlistMode] = useState<BuyerAccountSettings["watchlistMode"]>(
    "Watchlist alerts priority"
  );
  const [buyerCheckoutReadiness, setBuyerCheckoutReadiness] = useState<BuyerAccountSettings["checkoutReadiness"]>(
    "Ready to buy"
  );
  const [buyerContactEmail, setBuyerContactEmail] = useState("");
  const [buyerPhoneNumber, setBuyerPhoneNumber] = useState("");
  const [buyerAddressLine1, setBuyerAddressLine1] = useState("");
  const [buyerAddressLine2, setBuyerAddressLine2] = useState("");
  const [buyerCity, setBuyerCity] = useState("");
  const [buyerStateRegion, setBuyerStateRegion] = useState("");
  const [buyerPostalCode, setBuyerPostalCode] = useState("");
  const [buyerCountry, setBuyerCountry] = useState("");
  const [buyerPaymentMethod, setBuyerPaymentMethod] = useState<BuyerAccountSettings["paymentMethod"]>("Visa");
  const [buyerPaymentLast4, setBuyerPaymentLast4] = useState("");
  const [buyerPaymentExpiry, setBuyerPaymentExpiry] = useState("");
  const [buyerBillingPostalCode, setBuyerBillingPostalCode] = useState("");
  const [buyerSettingsMessage, setBuyerSettingsMessage] = useState<string | null>(null);

  const profileCompletion = useMemo(
    () => calculateProfileCompletion(currentBuyerSettings),
    [currentBuyerSettings]
  );

  const transactionSummary = useMemo(() => {
    if (!currentBuyerSettings) {
      return {
        count: 0,
        total: "$0.00",
        pending: 0,
        latestDate: "No orders yet"
      };
    }

    const total = currentBuyerSettings.transactions.reduce(
      (sum, transaction) => sum + currencyToNumber(transaction.amount),
      0
    );

    return {
      count: currentBuyerSettings.transactions.length,
      total: `$${total.toFixed(2)}`,
      pending: currentBuyerSettings.transactions.filter((transaction) => transaction.status === "Pending").length,
      latestDate: currentBuyerSettings.transactions[0]?.date ?? "No orders yet"
    };
  }, [currentBuyerSettings]);

  const buyerInitials = useMemo(
    () => buildIdentityInitials(session, currentBuyerSettings),
    [currentBuyerSettings, session]
  );

  const readinessCards = useMemo(
    () => buildReadinessCards(currentBuyerSettings, profileCompletion, transactionSummary.count),
    [currentBuyerSettings, profileCompletion, transactionSummary.count]
  );

  const signalCards = useMemo(() => buildSignalCards(currentBuyerSettings), [currentBuyerSettings]);
  const activityCards = useMemo(
    () => buildActivityCards(currentBuyerSettings?.transactions ?? []),
    [currentBuyerSettings]
  );

  useEffect(() => {
    if (!currentBuyerSettings) {
      setBuyerSettingsMessage(null);
      return;
    }

    setBuyerProfileLabel(currentBuyerSettings.profileLabel);
    setBuyerFavoriteCategory(currentBuyerSettings.favoriteCategory);
    setBuyerShippingRegion(currentBuyerSettings.shippingRegion);
    setBuyerBidPreset(currentBuyerSettings.bidPreset);
    setBuyerAlerts(currentBuyerSettings.alerts);
    setBuyerStreamAudio(currentBuyerSettings.streamAudio);
    setBuyerWatchlistMode(currentBuyerSettings.watchlistMode);
    setBuyerCheckoutReadiness(currentBuyerSettings.checkoutReadiness);
    setBuyerContactEmail(currentBuyerSettings.contactEmail);
    setBuyerPhoneNumber(currentBuyerSettings.phoneNumber);
    setBuyerAddressLine1(currentBuyerSettings.addressLine1);
    setBuyerAddressLine2(currentBuyerSettings.addressLine2);
    setBuyerCity(currentBuyerSettings.city);
    setBuyerStateRegion(currentBuyerSettings.stateRegion);
    setBuyerPostalCode(currentBuyerSettings.postalCode);
    setBuyerCountry(currentBuyerSettings.country);
    setBuyerPaymentMethod(currentBuyerSettings.paymentMethod);
    setBuyerPaymentLast4(currentBuyerSettings.paymentLast4);
    setBuyerPaymentExpiry(currentBuyerSettings.paymentExpiry);
    setBuyerBillingPostalCode(currentBuyerSettings.billingPostalCode);
  }, [currentBuyerSettings]);

  function submitBuyerSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextSettings: BuyerSettingsInput = {
      profileLabel: buyerProfileLabel,
      favoriteCategory: buyerFavoriteCategory,
      shippingRegion: buyerShippingRegion,
      bidPreset: buyerBidPreset,
      alerts: buyerAlerts,
      streamAudio: buyerStreamAudio,
      watchlistMode: buyerWatchlistMode,
      checkoutReadiness: buyerCheckoutReadiness,
      contactEmail: buyerContactEmail,
      phoneNumber: buyerPhoneNumber,
      addressLine1: buyerAddressLine1,
      addressLine2: buyerAddressLine2,
      city: buyerCity,
      stateRegion: buyerStateRegion,
      postalCode: buyerPostalCode,
      country: buyerCountry,
      paymentMethod: buyerPaymentMethod,
      paymentLast4: buyerPaymentLast4,
      paymentExpiry: buyerPaymentExpiry,
      billingPostalCode: buyerBillingPostalCode,
      transactions: currentBuyerSettings?.transactions ?? []
    };
    const validationMessage = buildBuyerSettingsValidationMessage(nextSettings);

    if (validationMessage) {
      setBuyerSettingsMessage(validationMessage);
      return;
    }

    const didSave = onSaveBuyerSettings(nextSettings);

    if (!didSave) {
      setBuyerSettingsMessage("Sign in with a buyer account to manage buyer settings.");
      return;
    }

    setBuyerSettingsMessage("Buyer profile was saved.");
  }

  function resetBuyerSettingsToDefaults() {
    const didReset = onResetBuyerSettings();

    if (!didReset) {
      setBuyerSettingsMessage("Sign in with a buyer account to reset buyer settings.");
      return;
    }

    setBuyerSettingsMessage("Buyer profile was reset to defaults.");
  }

  return (
    <section className="page-grid buyer-profile-page">
      <article className="showcase-card span-8 buyer-profile-hero">
        <span className="section-label">Buyer Profile</span>
        <div className="buyer-profile-header">
          <div className="buyer-identity-card">
            <div aria-hidden="true" className="buyer-identity-badge">
              {buyerInitials}
            </div>
            <div className="buyer-identity-copy">
              <strong>{currentBuyerSettings?.profileLabel || session?.name || "Buyer account required"}</strong>
              <p>
                {session?.role === "buyer"
                  ? "This page holds buyer identity, saved bidding defaults, checkout readiness, and recent order activity."
                  : "Sign in with a buyer account to unlock buyer-specific settings and order history."}
              </p>
            </div>
          </div>
          <div className="buyer-health-card">
            <span>Profile completion</span>
            <strong>{profileCompletion}%</strong>
            <div aria-hidden="true" className="buyer-health-meter">
              <div className="buyer-health-fill" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p>
              {currentBuyerSettings
                ? "Completion rises as contact, shipping, and payment details are filled."
                : "Buyer completion tracking begins after a buyer account is active."}
            </p>
          </div>
        </div>
        <h2>Buyer identity, bidding defaults, and checkout readiness live in one dedicated shopper workspace.</h2>
        <p>
          Keep discovery preferences, address details, payment setup, and recent order context together so a buyer can
          move from browsing to live bidding without friction.
        </p>
        <div className="buyer-settings-badges">
          {signalCards.map((item) => (
            <div className="route-pill buyer-signal-pill" key={item.label}>
              {item.label}: {item.value}
            </div>
          ))}
        </div>
        <div className="buyer-profile-moment-grid">
          {readinessCards.map((item) => (
            <div className="feature-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-4 buyer-profile-sidecard">
        <span className="section-label">Account State</span>
        <div className="stack">
          <div className="list-card">
            <strong>{session ? session.name : "No buyer signed in"}</strong>
            <p>{session ? `${session.email} - ${session.role}` : "Open Home to sign in with the seeded buyer account."}</p>
          </div>
          <div className="buyer-profile-quick-grid">
            <div className="list-card">
              <span>Recent spend</span>
              <strong>{transactionSummary.total}</strong>
              <p>{transactionSummary.count} recorded buyer orders.</p>
            </div>
            <div className="list-card">
              <span>Pending orders</span>
              <strong>{transactionSummary.pending}</strong>
              <p>Latest activity recorded on {transactionSummary.latestDate}.</p>
            </div>
          </div>
          <div className="list-card">
            <strong>Buyer profile route</strong>
            <p>This page keeps buyer account setup separate from the storefront landing page.</p>
          </div>
          {profileLinks.map((item) => (
            <Link className="list-card" key={item.to} to={item.to}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </Link>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Buyer Snapshot</span>
        <div className="card-grid-4 buyer-readiness-grid">
          <div className="list-card">
            <span>Favorite category</span>
            <strong>{currentBuyerSettings?.favoriteCategory ?? "Buyer only"}</strong>
            <p>Primary discovery lane for reminders and browsing focus.</p>
          </div>
          <div className="list-card">
            <span>Shipping region</span>
            <strong>{currentBuyerSettings?.shippingRegion ?? "Buyer only"}</strong>
            <p>Sets the expected delivery posture before checkout.</p>
          </div>
          <div className="list-card">
            <span>Bid preset</span>
            <strong>{currentBuyerSettings?.bidPreset ?? "Buyer only"}</strong>
            <p>Default jump used when entering active live rooms.</p>
          </div>
          <div className="list-card">
            <span>Payment</span>
            <strong>
              {currentBuyerSettings
                ? `${currentBuyerSettings.paymentMethod} ending in ${currentBuyerSettings.paymentLast4}`
                : "Buyer only"}
            </strong>
            <p>Checkout method staged for faster conversion.</p>
          </div>
        </div>
      </article>

      <article className="page-card span-12 buyer-settings-card">
        <span className="section-label">Profile Workspace</span>
        <div className="buyer-settings-grid">
          <div className="list-card buyer-settings-summary">
            <strong>
              {session?.role === "buyer"
                ? `Settings for ${session.name}`
                : "Buyer settings stay attached to the signed-in buyer account"}
            </strong>
            <p>
              {session?.role === "buyer"
                ? "Update how this buyer account behaves across discover, watchlists, and live bidding."
                : "Sign in as a buyer to store marketplace preferences, bid defaults, and checkout details."}
            </p>
            <div className="buyer-summary-stat-grid">
              <div className="list-card">
                <span>Buyer label</span>
                <strong>{currentBuyerSettings?.profileLabel ?? "Buyer only"}</strong>
                <p>Public-facing identity used across shopper surfaces.</p>
              </div>
              <div className="list-card">
                <span>Contact</span>
                <strong>{currentBuyerSettings ? formatSummaryValue(currentBuyerSettings.contactEmail) : "Buyer only"}</strong>
                <p>{currentBuyerSettings ? formatSummaryValue(currentBuyerSettings.phoneNumber) : "Buyer sign-in required"}</p>
              </div>
              <div className="list-card">
                <span>Checkout state</span>
                <strong>{currentBuyerSettings?.checkoutReadiness ?? "Buyer only"}</strong>
                <p>{transactionSummary.pending} pending order{transactionSummary.pending === 1 ? "" : "s"} tracked.</p>
              </div>
            </div>
            {currentBuyerSettings ? (
              <div className="buyer-settings-detail-stack">
                <div className="list-card">
                  <span>Shipping address</span>
                  <strong>{formatSummaryValue(currentBuyerSettings.addressLine1)}</strong>
                  <p>
                    {[currentBuyerSettings.addressLine2, currentBuyerSettings.city, currentBuyerSettings.stateRegion]
                      .filter(Boolean)
                      .join(", ") || "Complete city and region details"}
                  </p>
                  <p>
                    {[currentBuyerSettings.postalCode, currentBuyerSettings.country].filter(Boolean).join(" | ") ||
                      "Complete postal code and country"}
                  </p>
                </div>
                <div className="list-card">
                  <span>Payment</span>
                  <strong>
                    {currentBuyerSettings.paymentMethod} ending in {formatSummaryValue(currentBuyerSettings.paymentLast4)}
                  </strong>
                  <p>Expiry {formatSummaryValue(currentBuyerSettings.paymentExpiry)}</p>
                  <p>Billing postal code {formatSummaryValue(currentBuyerSettings.billingPostalCode)}</p>
                </div>
                <div className="list-card">
                  <span>Marketplace behavior</span>
                  <strong>{currentBuyerSettings.alerts}</strong>
                  <p>{currentBuyerSettings.watchlistMode}</p>
                  <p>{currentBuyerSettings.streamAudio}</p>
                </div>
              </div>
            ) : null}
          </div>

          {session?.role === "buyer" && currentBuyerSettings ? (
            <form className="login-form buyer-settings-form" onSubmit={submitBuyerSettings}>
              <div className="buyer-settings-section">
                <strong>Public buyer profile</strong>
                <p>Control the buyer-facing label and marketplace defaults used across discover and live bidding.</p>
              </div>
              <label className="field">
                <span>Buyer profile label</span>
                <input
                  autoComplete="nickname"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerProfileLabel(event.target.value);
                  }}
                  type="text"
                  value={buyerProfileLabel}
                />
              </label>
              <label className="field">
                <span>Favorite category</span>
                <select
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerFavoriteCategory(event.target.value as BuyerCategoryPreference);
                  }}
                  value={buyerFavoriteCategory}
                >
                  {buyerPreferenceCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Shipping preference</span>
                <select
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerShippingRegion(event.target.value as BuyerAccountSettings["shippingRegion"]);
                  }}
                  value={buyerShippingRegion}
                >
                  {buyerShippingRegions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Default bid jump</span>
                <select
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerBidPreset(event.target.value as BuyerAccountSettings["bidPreset"]);
                  }}
                  value={buyerBidPreset}
                >
                  {buyerBidPresets.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Live alert level</span>
                <select
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerAlerts(event.target.value as BuyerAccountSettings["alerts"]);
                  }}
                  value={buyerAlerts}
                >
                  {buyerAlertLevels.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Stream audio</span>
                <select
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerStreamAudio(event.target.value as BuyerAccountSettings["streamAudio"]);
                  }}
                  value={buyerStreamAudio}
                >
                  {buyerAudioModes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Watchlist behavior</span>
                <select
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerWatchlistMode(event.target.value as BuyerAccountSettings["watchlistMode"]);
                  }}
                  value={buyerWatchlistMode}
                >
                  {buyerWatchlistModes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Checkout readiness</span>
                <select
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerCheckoutReadiness(event.target.value as BuyerAccountSettings["checkoutReadiness"]);
                  }}
                  value={buyerCheckoutReadiness}
                >
                  {buyerCheckoutStates.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <div className="buyer-settings-section">
                <strong>Personal information</strong>
                <p>Keep contact and shipping details ready before checkout.</p>
              </div>
              <label className="field">
                <span>Contact email</span>
                <input
                  autoComplete="email"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerContactEmail(event.target.value);
                  }}
                  type="email"
                  value={buyerContactEmail}
                />
              </label>
              <label className="field">
                <span>Phone number</span>
                <input
                  autoComplete="tel"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerPhoneNumber(event.target.value);
                  }}
                  type="tel"
                  value={buyerPhoneNumber}
                />
              </label>
              <label className="field">
                <span>Address line 1</span>
                <input
                  autoComplete="address-line1"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerAddressLine1(event.target.value);
                  }}
                  type="text"
                  value={buyerAddressLine1}
                />
              </label>
              <label className="field">
                <span>Address line 2</span>
                <input
                  autoComplete="address-line2"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerAddressLine2(event.target.value);
                  }}
                  type="text"
                  value={buyerAddressLine2}
                />
              </label>
              <label className="field">
                <span>City</span>
                <input
                  autoComplete="address-level2"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerCity(event.target.value);
                  }}
                  type="text"
                  value={buyerCity}
                />
              </label>
              <label className="field">
                <span>State / region</span>
                <input
                  autoComplete="address-level1"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerStateRegion(event.target.value);
                  }}
                  type="text"
                  value={buyerStateRegion}
                />
              </label>
              <label className="field">
                <span>Postal code</span>
                <input
                  autoComplete="postal-code"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerPostalCode(event.target.value);
                  }}
                  type="text"
                  value={buyerPostalCode}
                />
              </label>
              <label className="field">
                <span>Country</span>
                <input
                  autoComplete="country-name"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerCountry(event.target.value);
                  }}
                  type="text"
                  value={buyerCountry}
                />
              </label>
              <div className="buyer-settings-section">
                <strong>Payment information</strong>
                <p>Maintain a buyer-side payment profile for faster checkout in the demo app.</p>
              </div>
              <label className="field">
                <span>Payment method</span>
                <select
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerPaymentMethod(event.target.value as BuyerAccountSettings["paymentMethod"]);
                  }}
                  value={buyerPaymentMethod}
                >
                  {buyerPaymentMethods.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Card / wallet last four</span>
                <input
                  autoComplete="cc-number"
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerPaymentLast4(event.target.value.replace(/\D/g, "").slice(0, 4));
                  }}
                  type="text"
                  value={buyerPaymentLast4}
                />
              </label>
              <label className="field">
                <span>Expiry</span>
                <input
                  autoComplete="cc-exp"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerPaymentExpiry(formatExpiryInput(event.target.value));
                  }}
                  placeholder="MM/YY"
                  type="text"
                  value={buyerPaymentExpiry}
                />
              </label>
              <label className="field">
                <span>Billing postal code</span>
                <input
                  autoComplete="postal-code"
                  onChange={(event) => {
                    setBuyerSettingsMessage(null);
                    setBuyerBillingPostalCode(event.target.value);
                  }}
                  type="text"
                  value={buyerBillingPostalCode}
                />
              </label>
              <div className="nav-actions">
                <button className="button-primary" type="submit">
                  Save Buyer Profile
                </button>
                <button
                  className="button-secondary"
                  onClick={() => {
                    setBuyerSettingsMessage(null);
                    resetBuyerSettingsToDefaults();
                  }}
                  type="button"
                >
                  Reset Defaults
                </button>
              </div>
              {buyerSettingsMessage ? <p className="feedback">{buyerSettingsMessage}</p> : null}
            </form>
          ) : (
            <div className="list-card buyer-settings-helper">
              <strong>Buyer sign-in required</strong>
              <p>Use the seeded buyer account on Home or create a buyer account there, then return here to manage the profile.</p>
            </div>
          )}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Recent Buyer Activity</span>
        {session?.role === "buyer" && currentBuyerSettings ? (
          <div className="card-grid-3 buyer-transaction-grid">
            {activityCards.map((transaction) => (
              <div className="list-card buyer-transaction-card" key={transaction.id}>
                <span>{transaction.label}</span>
                <strong>{transaction.title}</strong>
                <p>{transaction.detail}</p>
                <div className="buyer-transaction-meta">
                  <span className="route-pill">{transaction.status}</span>
                  <strong>{transaction.value}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="list-card buyer-settings-helper">
            <strong>Buyer sign-in required</strong>
            <p>Transaction history appears here after signing in with a buyer account.</p>
          </div>
        )}
      </article>
    </section>
  );
}
