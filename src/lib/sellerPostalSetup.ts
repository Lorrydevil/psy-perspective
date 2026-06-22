import type { AppSession } from "../App";
import { readStorageJSON, writeStorageJSON } from "./storage";

export const carrierOptions = ["USPS", "UPS", "FedEx", "DHL"] as const;
export const handlingOptions = ["Same day", "1 business day", "2 business days", "3 business days"] as const;
export const regionOptions = ["Domestic only", "Domestic + international", "Local pickup enabled"] as const;
export const packageOptions = ["Padded mailer", "Small box", "Medium box", "Mixed packaging"] as const;
export const insuranceOptions = ["Included on orders over $100", "Optional at checkout", "Always included"] as const;
export const labelOptions = ["Platform managed labels", "Bring your own carrier account", "Manual postage workflow"] as const;
export const pickupOptions = ["Weekday afternoon", "Weekday evening", "Next business morning", "Drop-off only"] as const;
export const returnWindowOptions = ["7 days", "14 days", "30 days", "Final sale"] as const;

export type SellerPostalSetupState = {
  profileName: string;
  primaryCarrier: (typeof carrierOptions)[number];
  backupCarrier: (typeof carrierOptions)[number];
  handlingWindow: (typeof handlingOptions)[number];
  serviceRegions: (typeof regionOptions)[number];
  defaultPackage: (typeof packageOptions)[number];
  insuranceRule: (typeof insuranceOptions)[number];
  dispatchCutoff: string;
  returnContact: string;
  returnPhone: string;
  warehouseLine1: string;
  warehouseLine2: string;
  warehouseCity: string;
  warehouseState: string;
  warehousePostalCode: string;
  warehouseCountry: string;
  shippingNote: string;
  labelWorkflow: (typeof labelOptions)[number];
  pickupWindow: (typeof pickupOptions)[number];
  returnWindow: (typeof returnWindowOptions)[number];
  averageParcelWeight: string;
  fragileCategories: string;
  signatureRequired: boolean;
  ecoPackaging: boolean;
  weekendDispatch: boolean;
  holdOrdersUntilStreamEnds: boolean;
};

export type SellerPostalReadinessCheck = {
  label: string;
  passed: boolean;
};

export const SELLER_POSTAL_SETUP_UPDATED_EVENT = "looplot:seller-postal-setup-updated";

export function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function createPostalStorageKey(session: AppSession | null) {
  const accountKey = session?.email?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ?? "seller";
  return `seller-postal-setup-${accountKey}`;
}

export function createDefaultPostalSetup(session: AppSession | null): SellerPostalSetupState {
  return {
    profileName: session?.name ? `${session.name} Shipping Desk` : "Seller Shipping Desk",
    primaryCarrier: "USPS",
    backupCarrier: "UPS",
    handlingWindow: "1 business day",
    serviceRegions: "Domestic + international",
    defaultPackage: "Small box",
    insuranceRule: "Included on orders over $100",
    dispatchCutoff: "15:00",
    returnContact: session?.email ?? "fulfillment@looplot.com",
    returnPhone: "(555) 010-3090",
    warehouseLine1: "245 Market District",
    warehouseLine2: "Suite 18",
    warehouseCity: "Austin",
    warehouseState: "TX",
    warehousePostalCode: "78702",
    warehouseCountry: "United States",
    shippingNote: "Luxury lots ship boxed with tracking. Lower-value add-ons can be bundled unless the buyer requests separation.",
    labelWorkflow: "Platform managed labels",
    pickupWindow: "Weekday afternoon",
    returnWindow: "14 days",
    averageParcelWeight: "1.2 lb",
    fragileCategories: "Luxury, Collectibles",
    signatureRequired: true,
    ecoPackaging: false,
    weekendDispatch: false,
    holdOrdersUntilStreamEnds: true
  };
}

export function normalizePostalSetup(value: unknown, session: AppSession | null): SellerPostalSetupState {
  const defaults = createDefaultPostalSetup(session);

  if (typeof value !== "object" || value === null) {
    return defaults;
  }

  const candidate = value as Partial<SellerPostalSetupState>;

  return {
    profileName: typeof candidate.profileName === "string" ? candidate.profileName : defaults.profileName,
    primaryCarrier: carrierOptions.includes(candidate.primaryCarrier as (typeof carrierOptions)[number])
      ? (candidate.primaryCarrier as (typeof carrierOptions)[number])
      : defaults.primaryCarrier,
    backupCarrier: carrierOptions.includes(candidate.backupCarrier as (typeof carrierOptions)[number])
      ? (candidate.backupCarrier as (typeof carrierOptions)[number])
      : defaults.backupCarrier,
    handlingWindow: handlingOptions.includes(candidate.handlingWindow as (typeof handlingOptions)[number])
      ? (candidate.handlingWindow as (typeof handlingOptions)[number])
      : defaults.handlingWindow,
    serviceRegions: regionOptions.includes(candidate.serviceRegions as (typeof regionOptions)[number])
      ? (candidate.serviceRegions as (typeof regionOptions)[number])
      : defaults.serviceRegions,
    defaultPackage: packageOptions.includes(candidate.defaultPackage as (typeof packageOptions)[number])
      ? (candidate.defaultPackage as (typeof packageOptions)[number])
      : defaults.defaultPackage,
    insuranceRule: insuranceOptions.includes(candidate.insuranceRule as (typeof insuranceOptions)[number])
      ? (candidate.insuranceRule as (typeof insuranceOptions)[number])
      : defaults.insuranceRule,
    dispatchCutoff: typeof candidate.dispatchCutoff === "string" ? candidate.dispatchCutoff : defaults.dispatchCutoff,
    returnContact: typeof candidate.returnContact === "string" ? candidate.returnContact : defaults.returnContact,
    returnPhone: typeof candidate.returnPhone === "string" ? candidate.returnPhone : defaults.returnPhone,
    warehouseLine1: typeof candidate.warehouseLine1 === "string" ? candidate.warehouseLine1 : defaults.warehouseLine1,
    warehouseLine2: typeof candidate.warehouseLine2 === "string" ? candidate.warehouseLine2 : defaults.warehouseLine2,
    warehouseCity: typeof candidate.warehouseCity === "string" ? candidate.warehouseCity : defaults.warehouseCity,
    warehouseState: typeof candidate.warehouseState === "string" ? candidate.warehouseState : defaults.warehouseState,
    warehousePostalCode:
      typeof candidate.warehousePostalCode === "string" ? candidate.warehousePostalCode : defaults.warehousePostalCode,
    warehouseCountry: typeof candidate.warehouseCountry === "string" ? candidate.warehouseCountry : defaults.warehouseCountry,
    shippingNote: typeof candidate.shippingNote === "string" ? candidate.shippingNote : defaults.shippingNote,
    labelWorkflow: labelOptions.includes(candidate.labelWorkflow as (typeof labelOptions)[number])
      ? (candidate.labelWorkflow as (typeof labelOptions)[number])
      : defaults.labelWorkflow,
    pickupWindow: pickupOptions.includes(candidate.pickupWindow as (typeof pickupOptions)[number])
      ? (candidate.pickupWindow as (typeof pickupOptions)[number])
      : defaults.pickupWindow,
    returnWindow: returnWindowOptions.includes(candidate.returnWindow as (typeof returnWindowOptions)[number])
      ? (candidate.returnWindow as (typeof returnWindowOptions)[number])
      : defaults.returnWindow,
    averageParcelWeight:
      typeof candidate.averageParcelWeight === "string" ? candidate.averageParcelWeight : defaults.averageParcelWeight,
    fragileCategories:
      typeof candidate.fragileCategories === "string" ? candidate.fragileCategories : defaults.fragileCategories,
    signatureRequired:
      typeof candidate.signatureRequired === "boolean" ? candidate.signatureRequired : defaults.signatureRequired,
    ecoPackaging: typeof candidate.ecoPackaging === "boolean" ? candidate.ecoPackaging : defaults.ecoPackaging,
    weekendDispatch: typeof candidate.weekendDispatch === "boolean" ? candidate.weekendDispatch : defaults.weekendDispatch,
    holdOrdersUntilStreamEnds:
      typeof candidate.holdOrdersUntilStreamEnds === "boolean"
        ? candidate.holdOrdersUntilStreamEnds
        : defaults.holdOrdersUntilStreamEnds
  };
}

export function readStoredPostalSetup(session: AppSession | null) {
  return readStorageJSON(createPostalStorageKey(session), createDefaultPostalSetup(session), (value) =>
    normalizePostalSetup(value, session)
  );
}

export function saveSellerPostalSetup(session: AppSession | null, setup: SellerPostalSetupState) {
  writeStorageJSON(createPostalStorageKey(session), setup, SELLER_POSTAL_SETUP_UPDATED_EVENT);
}

export function getSellerPostalReadiness(form: SellerPostalSetupState) {
  const checks: SellerPostalReadinessCheck[] = [
    {
      label: "Profile and carrier setup",
      passed: Boolean(form.profileName.trim() && form.primaryCarrier.trim() && form.backupCarrier.trim())
    },
    {
      label: "Carrier fallback is unique",
      passed: form.primaryCarrier !== form.backupCarrier
    },
    {
      label: "Return contact is valid",
      passed: isValidEmailAddress(form.returnContact.trim()) && Boolean(form.returnPhone.trim())
    },
    {
      label: "Warehouse address is complete",
      passed: Boolean(
        form.warehouseLine1.trim() &&
          form.warehouseCity.trim() &&
          form.warehouseState.trim() &&
          form.warehousePostalCode.trim() &&
          form.warehouseCountry.trim()
      )
    },
    {
      label: "Packaging guidance is defined",
      passed: Boolean(form.defaultPackage.trim() && form.shippingNote.trim() && form.averageParcelWeight.trim())
    },
    {
      label: "Returns and label workflow are set",
      passed: Boolean(form.labelWorkflow.trim() && form.returnWindow.trim() && form.pickupWindow.trim())
    }
  ];

  const count = checks.filter((item) => item.passed).length;
  const percent = Math.round((count / checks.length) * 100);
  const label =
    count === checks.length
      ? "Ready for seller launch"
      : count >= 4
        ? "Operational with follow-up needed"
        : "Needs fulfillment details";

  return {
    checks,
    count,
    percent,
    label,
    missingItems: checks.filter((item) => !item.passed)
  };
}
