import "server-only";

import { createHash } from "node:crypto";
import { PLANS, type PlanId } from "./plans";

export type PaidPlanId = Exclude<PlanId, "free">;

export type BillingConfig = {
  secretKey: string;
  priceIds: Record<PaidPlanId, string>;
  appUrl: URL;
  cookieSecret: string;
};

export type StripeCheckoutSession = {
  id: string;
  status: string | null;
  payment_status: string | null;
  mode: string | null;
  client_reference_id: string | null;
  subscription: string | { id: string } | null;
  url: string | null;
};

export type StripeSubscription = {
  id: string;
  status: string;
  customer: string | { id: string };
  items: {
    data: Array<{
      price: string | { id: string };
      quantity: number | null;
    }>;
  };
};

export type StripePrice = {
  id: string;
  object: string;
  active: boolean;
  billing_scheme: string;
  currency: string;
  unit_amount: number | null;
  unit_amount_decimal?: string | null;
  type: string;
  recurring: {
    interval: string;
    interval_count: number;
    usage_type: string;
  } | null;
  custom_unit_amount?: unknown;
  tiers_mode?: string | null;
  transform_quantity?: unknown;
};

export type StripeBillingPortalSession = {
  id: string;
  url: string;
};

const STRIPE_API = "https://api.stripe.com/v1";
const REQUEST_TIMEOUT_MS = 10_000;

function isPriceId(value: string | undefined): value is string {
  return Boolean(value && /^price_[A-Za-z0-9]+$/.test(value));
}

function parseAppUrl(value: string | undefined): URL | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const isLocalHttp =
      process.env.NODE_ENV !== "production" &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

    if (
      (url.protocol !== "https:" && !isLocalHttp) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export function getBillingConfig(
  env: NodeJS.ProcessEnv = process.env,
): BillingConfig | null {
  const secretKey = env.STRIPE_SECRET_KEY;
  const starterPriceId = env.STRIPE_STARTER_PRICE_ID;
  const proPriceId = env.STRIPE_PRO_PRICE_ID;
  const cookieSecret = env.BILLING_COOKIE_SECRET;
  const appUrl = parseAppUrl(env.APP_URL);

  if (
    !secretKey?.startsWith("sk_") ||
    !isPriceId(starterPriceId) ||
    !isPriceId(proPriceId) ||
    starterPriceId === proPriceId ||
    !appUrl ||
    !cookieSecret ||
    Buffer.byteLength(cookieSecret, "utf8") < 32
  ) {
    return null;
  }

  return {
    secretKey,
    priceIds: { starter: starterPriceId, pro: proPriceId },
    appUrl,
    cookieSecret,
  };
}

export function isCheckoutSessionId(value: string): boolean {
  return /^cs_(?:test|live)_[A-Za-z0-9]+$/.test(value);
}

export function isSubscriptionId(value: string): boolean {
  return /^sub_[A-Za-z0-9]+$/.test(value);
}

function stripeId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (typeof value === "string") return value;
  return value && typeof value.id === "string" ? value.id : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function stripeRequest<T>(
  config: BillingConfig,
  path: string,
  method: "GET" | "POST",
  form?: URLSearchParams,
  idempotencyKey?: string,
): Promise<T> {
  let response: Response;
  try {
    const requestInit: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        ...(form
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };
    if (method === "POST" && form) requestInit.body = form.toString();
    response = await fetch(`${STRIPE_API}${path}`, requestInit);
  } catch {
    throw new Error("stripe_unavailable");
  }

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error("stripe_unavailable");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("stripe_unavailable");
  }

  if (!isRecord(payload)) throw new Error("stripe_unavailable");
  return payload as T;
}

function hasExactUnitAmountDecimal(
  price: Record<string, unknown>,
  expectedAmount: number,
): boolean {
  const amount = price.unit_amount_decimal;
  if (amount === undefined || amount === null) return true;
  if (typeof amount !== "string" || !/^\d+(?:\.\d+)?$/.test(amount)) {
    return false;
  }

  const [whole, fractional = ""] = amount.split(".");
  return whole === String(expectedAmount) && /^0*$/.test(fractional);
}

function isConfiguredMonthlyPrice(
  value: unknown,
  expectedPriceId: string,
  expectedAmount: number,
): value is StripePrice {
  if (!isRecord(value) || !isRecord(value.recurring)) return false;
  const recurring = value.recurring;

  return (
    value.id === expectedPriceId &&
    value.object === "price" &&
    value.active === true &&
    value.billing_scheme === "per_unit" &&
    value.currency === "usd" &&
    value.unit_amount === expectedAmount &&
    hasExactUnitAmountDecimal(value, expectedAmount) &&
    value.type === "recurring" &&
    recurring.interval === "month" &&
    recurring.interval_count === 1 &&
    recurring.usage_type === "licensed" &&
    (value.custom_unit_amount === undefined || value.custom_unit_amount === null) &&
    (value.tiers_mode === undefined || value.tiers_mode === null) &&
    (value.transform_quantity === undefined || value.transform_quantity === null)
  );
}

async function validateConfiguredPrice(
  config: BillingConfig,
  plan: PaidPlanId,
): Promise<void> {
  const planDefinition = PLANS.find((candidate) => candidate.id === plan);
  const priceId = config.priceIds[plan];
  if (!planDefinition || !priceId) throw new Error("stripe_unavailable");

  const price = await stripeRequest<unknown>(
    config,
    `/prices/${encodeURIComponent(priceId)}`,
    "GET",
  );
  if (!isConfiguredMonthlyPrice(price, priceId, planDefinition.price * 100)) {
    throw new Error("stripe_unavailable");
  }
}

function createCheckoutIdempotencyKey(
  visitorId: string,
  generation: string,
): string {
  const digest = createHash("sha256")
    .update("checkout\0")
    .update(visitorId)
    .update("\0")
    .update(generation)
    .digest("hex");
  return `ai-perfect-shot-checkout-${digest}`;
}

export async function createCheckoutSession(
  config: BillingConfig,
  plan: PaidPlanId,
  visitorId: string,
  generation = "initial",
): Promise<{ id: string; url: string }> {
  if (
    !/^[A-Za-z0-9_-]{43}$/.test(visitorId) ||
    (generation !== "initial" && !isCheckoutSessionId(generation))
  ) {
    throw new Error("invalid_checkout_generation");
  }

  await validateConfiguredPrice(config, plan);

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("payment_method_types[0]", "card");
  form.set("client_reference_id", visitorId);
  form.set("line_items[0][price]", config.priceIds[plan]);
  form.set("line_items[0][quantity]", "1");
  form.set(
    "success_url",
    `${new URL("/billing/success", config.appUrl).toString()}?session_id={CHECKOUT_SESSION_ID}`,
  );
  form.set("cancel_url", new URL("/#pricing", config.appUrl).toString());

  const session = await stripeRequest<StripeCheckoutSession>(
    config,
    "/checkout/sessions",
    "POST",
    form,
    createCheckoutIdempotencyKey(visitorId, generation),
  );

  if (
    !session.id ||
    !isCheckoutSessionId(session.id) ||
    !session.url ||
    !isStripeHostedUrl(session.url, "checkout.stripe.com")
  ) {
    throw new Error("stripe_unavailable");
  }

  return { id: session.id, url: session.url };
}

export async function createBillingPortalSession(
  config: BillingConfig,
  customerId: string,
): Promise<{ id: string; url: string }> {
  if (!/^cus_[A-Za-z0-9]+$/.test(customerId))
    throw new Error("invalid_customer");

  const form = new URLSearchParams();
  form.set("customer", customerId);
  form.set("return_url", new URL("/camera", config.appUrl).toString());
  const session = await stripeRequest<StripeBillingPortalSession>(
    config,
    "/billing_portal/sessions",
    "POST",
    form,
  );

  if (
    !session.id ||
    !session.url ||
    !isStripeHostedUrl(session.url, "billing.stripe.com")
  ) {
    throw new Error("stripe_unavailable");
  }

  return { id: session.id, url: session.url };
}

export async function getCheckoutSession(
  config: BillingConfig,
  sessionId: string,
): Promise<StripeCheckoutSession> {
  if (!isCheckoutSessionId(sessionId))
    throw new Error("invalid_checkout_session");
  return stripeRequest<StripeCheckoutSession>(
    config,
    `/checkout/sessions/${encodeURIComponent(sessionId)}`,
    "GET",
  );
}

export async function expireCheckoutSession(
  config: BillingConfig,
  sessionId: string,
): Promise<StripeCheckoutSession> {
  if (!isCheckoutSessionId(sessionId))
    throw new Error("invalid_checkout_session");
  return stripeRequest<StripeCheckoutSession>(
    config,
    `/checkout/sessions/${encodeURIComponent(sessionId)}/expire`,
    "POST",
  );
}

export async function getSubscription(
  config: BillingConfig,
  subscriptionId: string,
): Promise<StripeSubscription> {
  if (!isSubscriptionId(subscriptionId))
    throw new Error("invalid_subscription");
  const query = new URLSearchParams({ "expand[]": "items.data.price" });
  return stripeRequest<StripeSubscription>(
    config,
    `/subscriptions/${encodeURIComponent(subscriptionId)}?${query.toString()}`,
    "GET",
  );
}

export function isStripeHostedUrl(value: string, hostname: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === hostname;
  } catch {
    return false;
  }
}

export function planForActiveSubscription(
  subscription: StripeSubscription,
  priceIds: BillingConfig["priceIds"],
): PaidPlanId | null {
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return null;
  }

  if (
    !Array.isArray(subscription.items?.data) ||
    subscription.items.data.length !== 1
  ) {
    return null;
  }

  const [item] = subscription.items.data;
  if (!item || item.quantity !== 1) return null;

  const currentPriceId = stripeId(item.price);
  if (currentPriceId === priceIds.starter) return "starter";
  if (currentPriceId === priceIds.pro) return "pro";
  return null;
}

export function verifiedCheckoutPlan(
  session: StripeCheckoutSession,
  subscription: StripeSubscription,
  expectedClientReferenceId: string,
  priceIds: BillingConfig["priceIds"],
): PaidPlanId | null {
  const subscriptionId = stripeId(session.subscription);

  if (
    session.status !== "complete" ||
    session.payment_status !== "paid" ||
    session.mode !== "subscription" ||
    session.client_reference_id !== expectedClientReferenceId ||
    !subscriptionId ||
    subscription.id !== subscriptionId
  ) {
    return null;
  }

  return planForActiveSubscription(subscription, priceIds);
}
