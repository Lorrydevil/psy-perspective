import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AppSession } from "../App";
import {
  carrierOptions,
  createDefaultPostalSetup,
  getSellerPostalReadiness,
  handlingOptions,
  insuranceOptions,
  isValidEmailAddress,
  labelOptions,
  packageOptions,
  pickupOptions,
  readStoredPostalSetup,
  regionOptions,
  returnWindowOptions,
  saveSellerPostalSetup,
  type SellerPostalSetupState
} from "../lib/sellerPostalSetup";

const sellerPostalSignals = [
  {
    title: "Shipping rules stay backstage",
    detail: "Postal setup is kept on a seller-only route so fulfillment logic does not leak into buyer pages."
  },
  {
    title: "Carrier fallback is explicit",
    detail: "Sellers can define a backup carrier before going live so fulfillment does not stall after a sold lot."
  },
  {
    title: "Warehouse identity is saved",
    detail: "Return address, dispatch notes, and packing defaults persist with the seller account."
  }
] as const;

const fulfillmentChecks = [
  "Carrier selected and backup route confirmed",
  "Handling window aligns with stream promises",
  "Warehouse and return contact are complete",
  "Packaging notes cover fragile or premium lots"
] as const;

const shippingPresets = [
  {
    id: "luxury-signature",
    title: "Luxury Signature",
    detail: "Premium handling for high-value lots with faster dispatch and signature coverage.",
    values: {
      primaryCarrier: "UPS",
      backupCarrier: "FedEx",
      handlingWindow: "1 business day",
      serviceRegions: "Domestic + international",
      defaultPackage: "Medium box",
      insuranceRule: "Always included",
      labelWorkflow: "Bring your own carrier account",
      pickupWindow: "Weekday afternoon",
      returnWindow: "14 days",
      averageParcelWeight: "2.5 lb",
      fragileCategories: "Luxury, Collectibles",
      signatureRequired: true,
      ecoPackaging: false,
      weekendDispatch: false,
      holdOrdersUntilStreamEnds: true
    }
  },
  {
    id: "fast-flips",
    title: "Fast Flips",
    detail: "Lean packaging and rapid dispatch for cards, accessories, and quick-turn add-ons.",
    values: {
      primaryCarrier: "USPS",
      backupCarrier: "UPS",
      handlingWindow: "Same day",
      serviceRegions: "Domestic only",
      defaultPackage: "Padded mailer",
      insuranceRule: "Optional at checkout",
      labelWorkflow: "Platform managed labels",
      pickupWindow: "Weekday evening",
      returnWindow: "7 days",
      averageParcelWeight: "0.6 lb",
      fragileCategories: "Trading Cards, Accessories",
      signatureRequired: false,
      ecoPackaging: true,
      weekendDispatch: true,
      holdOrdersUntilStreamEnds: false
    }
  },
  {
    id: "mixed-marketplace",
    title: "Mixed Marketplace",
    detail: "Balanced default for sellers mixing auction lots, bundles, and occasional international orders.",
    values: {
      primaryCarrier: "USPS",
      backupCarrier: "DHL",
      handlingWindow: "2 business days",
      serviceRegions: "Domestic + international",
      defaultPackage: "Mixed packaging",
      insuranceRule: "Included on orders over $100",
      labelWorkflow: "Platform managed labels",
      pickupWindow: "Next business morning",
      returnWindow: "30 days",
      averageParcelWeight: "1.4 lb",
      fragileCategories: "Collectibles, Beauty",
      signatureRequired: true,
      ecoPackaging: true,
      weekendDispatch: false,
      holdOrdersUntilStreamEnds: true
    }
  }
] as const;

const handoffStages = [
  {
    title: "Live sale closes",
    detail: "Lock the winning buyer, confirm the lot outcome, and move the order into the packing queue."
  },
  {
    title: "Packing rules apply",
    detail: "Postal defaults drive packaging, insurance, and signature logic without re-entry."
  },
  {
    title: "Dispatch handoff",
    detail: "Pickup timing, carrier fallback, and returns rules stay attached to the seller profile."
  }
] as const;

export default function SellerPostalSetup({ session }: { session: AppSession | null }) {
  const [form, setForm] = useState<SellerPostalSetupState>(() => readStoredPostalSetup(session));
  const [feedback, setFeedback] = useState("Postal setup is ready to be reviewed and saved.");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    setForm(readStoredPostalSetup(session));
    setFeedback("Postal setup is ready to be reviewed and saved.");
    setActivePreset(null);
  }, [session]);

  const { checks: readinessChecks, count: readinessCount, percent: readinessPercent, label: readinessLabel, missingItems } =
    getSellerPostalReadiness(form);

  function handleFieldChange<Key extends keyof SellerPostalSetupState>(key: Key, value: SellerPostalSetupState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(presetId: string) {
    const preset = shippingPresets.find((entry) => entry.id === presetId);

    if (!preset) {
      return;
    }

    setForm((current) => ({
      ...current,
      ...preset.values
    }));
    setActivePreset(preset.id);
    setFeedback(`${preset.title} preset applied. Review warehouse and contact details before saving.`);
  }

  function handleSave() {
    if (!form.profileName.trim()) {
      setFeedback("Add a postal profile name before saving.");
      return;
    }

    if (form.primaryCarrier === form.backupCarrier) {
      setFeedback("Choose a different backup carrier so fulfillment has a real fallback.");
      return;
    }

    if (!isValidEmailAddress(form.returnContact.trim())) {
      setFeedback("Enter a valid return contact email before saving postal setup.");
      return;
    }

    if (
      !form.warehouseLine1.trim() ||
      !form.warehouseCity.trim() ||
      !form.warehouseState.trim() ||
      !form.warehousePostalCode.trim() ||
      !form.warehouseCountry.trim()
    ) {
      setFeedback("Complete the warehouse address before saving postal setup.");
      return;
    }

    saveSellerPostalSetup(session, form);
    setFeedback(`Postal setup saved for ${form.profileName}. Fulfillment rules are ready for the seller backend.`);
  }

  function handleReset() {
    const defaults = createDefaultPostalSetup(session);
    setForm(defaults);
    saveSellerPostalSetup(session, defaults);
    setFeedback("Postal setup reset to the seller default profile.");
    setActivePreset(null);
  }

  return (
    <section className="page-grid">
      <article className="showcase-card span-8">
        <span className="section-label">Seller Postal Service</span>
        <h2>Postal service setup now has its own seller page for fulfillment, carrier, and warehouse rules.</h2>
        <p>
          {session
            ? `${session.name} can configure dispatch defaults, return details, and carrier preferences here before items move from sold lots into packing.`
            : "Seller postal setup is restricted to approved seller sessions."}
        </p>
        <div className="metric-grid">
          <div className="metric-card">
            <span>Primary Carrier</span>
            <strong>{form.primaryCarrier}</strong>
          </div>
          <div className="metric-card">
            <span>Handling Window</span>
            <strong>{form.handlingWindow}</strong>
          </div>
          <div className="metric-card">
            <span>Coverage</span>
            <strong>{form.serviceRegions}</strong>
          </div>
          <div className="metric-card">
            <span>Status</span>
            <strong>{readinessLabel}</strong>
          </div>
          <div className="metric-card">
            <span>Readiness</span>
            <strong>{readinessPercent}% complete</strong>
          </div>
        </div>
      </article>

      <article className="page-card span-4">
        <span className="section-label">Seller Links</span>
        <div className="stack">
          <Link className="list-card" to="/seller">
            <strong>Seller Hub</strong>
            <p>Return to wheel settings, stream setup, and listing queue.</p>
          </Link>
          <Link className="list-card" to="/live">
            <strong>Live Floor</strong>
            <p>Preview the buyer-facing live surface after seller setup is complete.</p>
          </Link>
          <div className="list-card">
            <strong>Fulfillment Readiness</strong>
            <p>
              {readinessCount} of {readinessChecks.length} operational checks are complete. Save carrier, warehouse,
              and return details before launch.
            </p>
          </div>
        </div>
      </article>

      <article className="page-card span-12 seller-control-surface">
        <span className="section-label">Shipping Presets</span>
        <h2>Start from a seller shipping profile instead of rebuilding postal rules every time.</h2>
        <p>
          Apply a preset that matches the stream format, then review warehouse and contact details before saving the
          seller profile.
        </p>
        <div className="card-grid-3 seller-listing-grid">
          {shippingPresets.map((preset) => (
            <button
              className={`list-card seller-listing-card${activePreset === preset.id ? " is-active" : ""}`}
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              type="button"
            >
              <span className="card-kicker">Preset</span>
              <strong>{preset.title}</strong>
              <p>{preset.detail}</p>
              <div className="seller-listing-actions">
                <span>{preset.values.primaryCarrier} primary</span>
                <span>{preset.values.handlingWindow}</span>
                <span>{preset.values.returnWindow} returns</span>
              </div>
            </button>
          ))}
        </div>
      </article>

      <article className="page-card span-12 seller-control-surface">
        <span className="section-label">Postal Profile</span>
        <div className="seller-lot-editor-grid">
          <label className="field">
            <span>Profile name</span>
            <input
              onChange={(event) => handleFieldChange("profileName", event.target.value)}
              type="text"
              value={form.profileName}
            />
          </label>
          <label className="field">
            <span>Primary carrier</span>
            <select
              onChange={(event) => handleFieldChange("primaryCarrier", event.target.value as SellerPostalSetupState["primaryCarrier"])}
              value={form.primaryCarrier}
            >
              {carrierOptions.map((carrier) => (
                <option key={carrier} value={carrier}>
                  {carrier}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Backup carrier</span>
            <select
              onChange={(event) => handleFieldChange("backupCarrier", event.target.value as SellerPostalSetupState["backupCarrier"])}
              value={form.backupCarrier}
            >
              {carrierOptions.map((carrier) => (
                <option key={carrier} value={carrier}>
                  {carrier}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Handling window</span>
            <select
              onChange={(event) => handleFieldChange("handlingWindow", event.target.value as SellerPostalSetupState["handlingWindow"])}
              value={form.handlingWindow}
            >
              {handlingOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Service regions</span>
            <select
              onChange={(event) => handleFieldChange("serviceRegions", event.target.value as SellerPostalSetupState["serviceRegions"])}
              value={form.serviceRegions}
            >
              {regionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Default package</span>
            <select
              onChange={(event) => handleFieldChange("defaultPackage", event.target.value as SellerPostalSetupState["defaultPackage"])}
              value={form.defaultPackage}
            >
              {packageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Insurance rule</span>
            <select
              onChange={(event) => handleFieldChange("insuranceRule", event.target.value as SellerPostalSetupState["insuranceRule"])}
              value={form.insuranceRule}
            >
              {insuranceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Label workflow</span>
            <select
              onChange={(event) => handleFieldChange("labelWorkflow", event.target.value as SellerPostalSetupState["labelWorkflow"])}
              value={form.labelWorkflow}
            >
              {labelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Pickup window</span>
            <select
              onChange={(event) => handleFieldChange("pickupWindow", event.target.value as SellerPostalSetupState["pickupWindow"])}
              value={form.pickupWindow}
            >
              {pickupOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Return window</span>
            <select
              onChange={(event) => handleFieldChange("returnWindow", event.target.value as SellerPostalSetupState["returnWindow"])}
              value={form.returnWindow}
            >
              {returnWindowOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Dispatch cutoff</span>
            <input
              onChange={(event) => handleFieldChange("dispatchCutoff", event.target.value)}
              type="time"
              value={form.dispatchCutoff}
            />
          </label>
          <label className="field">
            <span>Return contact email</span>
            <input
              onChange={(event) => handleFieldChange("returnContact", event.target.value)}
              type="email"
              value={form.returnContact}
            />
          </label>
          <label className="field">
            <span>Return phone</span>
            <input
              onChange={(event) => handleFieldChange("returnPhone", event.target.value)}
              type="text"
              value={form.returnPhone}
            />
          </label>
          <label className="field">
            <span>Warehouse line 1</span>
            <input
              onChange={(event) => handleFieldChange("warehouseLine1", event.target.value)}
              type="text"
              value={form.warehouseLine1}
            />
          </label>
          <label className="field">
            <span>Warehouse line 2</span>
            <input
              onChange={(event) => handleFieldChange("warehouseLine2", event.target.value)}
              type="text"
              value={form.warehouseLine2}
            />
          </label>
          <label className="field">
            <span>City</span>
            <input onChange={(event) => handleFieldChange("warehouseCity", event.target.value)} type="text" value={form.warehouseCity} />
          </label>
          <label className="field">
            <span>State / Region</span>
            <input onChange={(event) => handleFieldChange("warehouseState", event.target.value)} type="text" value={form.warehouseState} />
          </label>
          <label className="field">
            <span>Postal code</span>
            <input
              onChange={(event) => handleFieldChange("warehousePostalCode", event.target.value)}
              type="text"
              value={form.warehousePostalCode}
            />
          </label>
          <label className="field">
            <span>Country</span>
            <input
              onChange={(event) => handleFieldChange("warehouseCountry", event.target.value)}
              type="text"
              value={form.warehouseCountry}
            />
          </label>
          <label className="field">
            <span>Average parcel weight</span>
            <input
              onChange={(event) => handleFieldChange("averageParcelWeight", event.target.value)}
              type="text"
              value={form.averageParcelWeight}
            />
          </label>
          <label className="field">
            <span>Fragile categories</span>
            <input
              onChange={(event) => handleFieldChange("fragileCategories", event.target.value)}
              type="text"
              value={form.fragileCategories}
            />
          </label>
          <label className="field stream-field-full">
            <span>Shipping note</span>
            <textarea
              onChange={(event) => handleFieldChange("shippingNote", event.target.value)}
              value={form.shippingNote}
            />
          </label>
        </div>
        <div className="wheel-action-bar launch-console-actions">
          <label className="list-card">
            <strong>Signature required</strong>
            <p>Apply signature confirmation for higher-risk shipments.</p>
            <input
              checked={form.signatureRequired}
              onChange={(event) => handleFieldChange("signatureRequired", event.target.checked)}
              type="checkbox"
            />
          </label>
          <label className="list-card">
            <strong>Eco packaging</strong>
            <p>Prefer recyclable mailers and reduced filler where possible.</p>
            <input
              checked={form.ecoPackaging}
              onChange={(event) => handleFieldChange("ecoPackaging", event.target.checked)}
              type="checkbox"
            />
          </label>
          <label className="list-card">
            <strong>Weekend dispatch</strong>
            <p>Allow orders from live shows to move out on Saturday or Sunday when staff is available.</p>
            <input
              checked={form.weekendDispatch}
              onChange={(event) => handleFieldChange("weekendDispatch", event.target.checked)}
              type="checkbox"
            />
          </label>
          <label className="list-card">
            <strong>Hold orders until stream ends</strong>
            <p>Keep invoices grouped until the show closes so combined shipping rules can be applied once.</p>
            <input
              checked={form.holdOrdersUntilStreamEnds}
              onChange={(event) => handleFieldChange("holdOrdersUntilStreamEnds", event.target.checked)}
              type="checkbox"
            />
          </label>
          <div className="wheel-action-buttons">
            <button className="button-secondary" onClick={handleReset} type="button">
              Reset Profile
            </button>
            <button className="button-primary" onClick={handleSave} type="button">
              Save Postal Setup
            </button>
          </div>
        </div>
        <p className="feedback">{feedback}</p>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Operational Readiness</span>
        <div className="card-grid-3">
          {readinessChecks.map((item) => (
            <div className="list-card" key={item.label}>
              <span className="card-kicker">{item.passed ? "Ready" : "Action needed"}</span>
              <strong>{item.label}</strong>
            </div>
          ))}
        </div>
        {missingItems.length > 0 ? (
          <p className="feedback">
            Remaining blockers: {missingItems.map((item) => item.label).join(" | ")}.
          </p>
        ) : (
          <p className="feedback">All seller postal checks are complete and ready for launch use.</p>
        )}
      </article>

      <article className="page-card span-12">
        <span className="section-label">Fulfillment Handoff</span>
        <div className="card-grid-3">
          {handoffStages.map((item) => (
            <div className="list-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Fulfillment Guardrails</span>
        <div className="card-grid-4">
          {fulfillmentChecks.map((item) => (
            <div className="list-card" key={item}>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Why This Page Exists</span>
        <div className="card-grid-3">
          {sellerPostalSignals.map((item) => (
            <div className="list-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
