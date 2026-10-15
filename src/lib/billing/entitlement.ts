import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { PlanId } from "./plans";
import type { PaidPlanId } from "./stripe";
import {
  getBillingConfig,
  getSubscription,
  isCheckoutSessionId,
  isSubscriptionId,
  planForActiveSubscription,
} from "./stripe";

export const VISITOR_COOKIE = "ps_billing_visitor";
export const ENTITLEMENT_COOKIE = "ps_billing_entitlement";

export const ENTITLEMENT_TTL_SECONDS = 30 * 24 * 60 * 60;
const SUBSCRIPTION_CACHE_TTL_MS = 60_000;
const MAX_CACHED_SUBSCRIPTIONS = 256;

export type VerifiedEntitlement = {
  subscriptionId: string;
  plan: PaidPlanId;
  expiresAt: number;
};

export type VisitorBinding = {
  id: string;
  checkoutSessionId: string | null;
  plan: PaidPlanId | null;
};

type CachedStatus = {
  plan: PaidPlanId | null;
  expiresAt: number;
};

const subscriptionStatusCache = new Map<string, CachedStatus>();

function signature(value: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(value).digest();
}

function safeSignatureMatch(value: string, expected: Buffer): boolean {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
  let actual: Buffer;
  try {
    actual = Buffer.from(value, "base64url");
  } catch {
    return false;
  }

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createVisitorIdentity(secret: string): {
  id: string;
  cookie: string;
} {
  const id = randomBytes(32).toString("base64url");
  return { id, cookie: signVisitorBinding(id, null, null, secret) };
}

function signVisitorBinding(
  id: string,
  checkoutSessionId: string | null,
  plan: PaidPlanId | null,
  secret: string,
): string {
  const payload = Buffer.from(
    `${id}|${checkoutSessionId ?? ""}|${plan ?? ""}`,
    "utf8",
  ).toString("base64url");
  const signed = signature(payload, secret).toString("base64url");
  return `${payload}.${signed}`;
}

export function createPendingVisitorCookie(
  id: string,
  checkoutSessionId: string,
  plan: PaidPlanId,
  secret: string,
): string {
  if (
    !/^[A-Za-z0-9_-]{43}$/.test(id) ||
    !isCheckoutSessionId(checkoutSessionId)
  ) {
    throw new Error("invalid_visitor_binding");
  }
  return signVisitorBinding(id, checkoutSessionId, plan, secret);
}

export function readVisitorCookie(
  cookie: string | undefined,
  secret: string,
): VisitorBinding | null {
  if (!cookie || cookie.length > 512) return null;
  const [encodedPayload, suppliedSignature, extra] = cookie.split(".");
  if (
    extra !== undefined ||
    !encodedPayload ||
    !/^[A-Za-z0-9_-]+$/.test(encodedPayload) ||
    !suppliedSignature ||
    !safeSignatureMatch(suppliedSignature, signature(encodedPayload, secret))
  ) {
    return null;
  }

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const parts = payload.split("|");
  if (parts.length !== 3 || !/^[A-Za-z0-9_-]{43}$/.test(parts[0] ?? "")) {
    return null;
  }

  const checkoutSessionId = parts[1] || null;
  if (checkoutSessionId && !isCheckoutSessionId(checkoutSessionId)) return null;
  const plan = parts[2] || null;
  if (
    (checkoutSessionId && plan !== "starter" && plan !== "pro") ||
    (!checkoutSessionId && plan !== null)
  ) {
    return null;
  }
  return {
    id: parts[0],
    checkoutSessionId,
    plan: plan as PaidPlanId | null,
  };
}

export function verifyVisitorCookie(
  cookie: string | undefined,
  secret: string,
): string | null {
  return readVisitorCookie(cookie, secret)?.id ?? null;
}

export function pendingCheckoutSessionId(
  cookie: string | undefined,
  secret: string,
): string | null {
  return readVisitorCookie(cookie, secret)?.checkoutSessionId ?? null;
}

export function pendingCheckoutPlan(
  cookie: string | undefined,
  secret: string,
): PaidPlanId | null {
  return readVisitorCookie(cookie, secret)?.plan ?? null;
}

export function createEntitlementCookie(
  subscriptionId: string,
  plan: PaidPlanId,
  secret: string,
  nowMs = Date.now(),
): { value: string; expiresAt: number } {
  const expiresAt = Math.floor(nowMs / 1000) + ENTITLEMENT_TTL_SECONDS;
  const payload = `${subscriptionId}|${plan}|${expiresAt}`;
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  const signed = signature(encodedPayload, secret).toString("base64url");
  return { value: `${encodedPayload}.${signed}`, expiresAt };
}

export function readEntitlementCookie(
  cookie: string | undefined,
  secret: string,
  nowMs = Date.now(),
): VerifiedEntitlement | null {
  if (!cookie || cookie.length > 512) return null;
  const [encodedPayload, suppliedSignature, extra] = cookie.split(".");
  if (
    extra !== undefined ||
    !encodedPayload ||
    !/^[A-Za-z0-9_-]+$/.test(encodedPayload) ||
    !suppliedSignature ||
    !safeSignatureMatch(suppliedSignature, signature(encodedPayload, secret))
  ) {
    return null;
  }

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const parts = payload.split("|");
  if (parts.length !== 3) return null;
  const [subscriptionId, plan, expiryText] = parts;
  const expiresAt = Number(expiryText);
  const nowSeconds = Math.floor(nowMs / 1000);

  if (
    !isSubscriptionId(subscriptionId ?? "") ||
    (plan !== "starter" && plan !== "pro") ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= nowSeconds ||
    expiresAt > nowSeconds + ENTITLEMENT_TTL_SECONDS
  ) {
    return null;
  }

  return { subscriptionId, plan, expiresAt };
}

function setStatusCache(
  subscriptionId: string,
  plan: PaidPlanId | null,
  nowMs: number,
) {
  if (subscriptionStatusCache.size >= MAX_CACHED_SUBSCRIPTIONS) {
    const oldestKey = subscriptionStatusCache.keys().next().value;
    if (oldestKey) subscriptionStatusCache.delete(oldestKey);
  }

  subscriptionStatusCache.set(subscriptionId, {
    plan,
    expiresAt: nowMs + SUBSCRIPTION_CACHE_TTL_MS,
  });
}

async function currentPlanForSubscription(
  subscriptionId: string,
  priceIds: { starter: string; pro: string },
  nowMs: number,
): Promise<PaidPlanId | null | "unavailable"> {
  const cached = subscriptionStatusCache.get(subscriptionId);
  if (cached && cached.expiresAt > nowMs) return cached.plan;
  if (cached) subscriptionStatusCache.delete(subscriptionId);

  const config = getBillingConfig();
  if (!config) return null;

  try {
    const subscription = await getSubscription(config, subscriptionId);
    const plan = planForActiveSubscription(subscription, priceIds);
    setStatusCache(subscriptionId, plan, nowMs);
    return plan;
  } catch {
    return "unavailable";
  }
}

function expireEntitlementCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  cookieStore.set(ENTITLEMENT_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getActivePlan(): Promise<PlanId> {
  const config = getBillingConfig();
  if (!config) return "free";

  const cookieStore = await cookies();
  const cookie = cookieStore.get(ENTITLEMENT_COOKIE)?.value;
  const entitlement = readEntitlementCookie(cookie, config.cookieSecret);
  if (!entitlement) {
    if (cookie) expireEntitlementCookie(cookieStore);
    return "free";
  }

  const currentPlan = await currentPlanForSubscription(
    entitlement.subscriptionId,
    config.priceIds,
    Date.now(),
  );
  if (currentPlan === "unavailable") return "free";
  if (!currentPlan) {
    expireEntitlementCookie(cookieStore);
    return "free";
  }

  // Stripe remains the plan source of truth, so customer-portal plan changes
  // refresh the signed browser cookie to the newly active configured price.
  const renewed = createEntitlementCookie(
    entitlement.subscriptionId,
    currentPlan,
    config.cookieSecret,
  );
  cookieStore.set(ENTITLEMENT_COOKIE, renewed.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ENTITLEMENT_TTL_SECONDS,
  });

  return currentPlan;
}
