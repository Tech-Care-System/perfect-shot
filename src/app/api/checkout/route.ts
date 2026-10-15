import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createPendingVisitorCookie,
  ENTITLEMENT_COOKIE,
  readEntitlementCookie,
  readVisitorCookie,
  VISITOR_COOKIE,
} from "@/lib/billing/entitlement";
import {
  billingNoticeResponse,
  isSameAppOrigin,
} from "@/lib/billing/responses";
import { isPaidPlanId } from "@/lib/billing/plans";
import {
  createCheckoutSession,
  expireCheckoutSession,
  getCheckoutSession,
  getBillingConfig,
  getSubscription,
  isStripeHostedUrl,
  planForActiveSubscription,
} from "@/lib/billing/stripe";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 2_048;
const PENDING_SESSION_TTL_SECONDS = 24 * 60 * 60;

async function readBodyWithinLimit(request: Request): Promise<string | null> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES)
    return null;

  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

async function requestedPlan(request: Request): Promise<unknown> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  const body = await readBodyWithinLimit(request);
  if (body === null) return undefined;

  if (contentType === "application/json") {
    try {
      const parsed: unknown = JSON.parse(body);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        Object.keys(parsed).length === 1 &&
        "plan" in parsed
      ) {
        return parsed.plan;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  if (contentType === "application/x-www-form-urlencoded") {
    const form = new URLSearchParams(body);
    const values = form.getAll("plan");
    if (values.length === 1 && [...form.keys()].length === 1) return values[0];
  }

  return undefined;
}

function wantsJsonResponse(request: Request): boolean {
  const requestType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  return (
    requestType === "application/json" ||
    Boolean(request.headers.get("accept")?.includes("application/json"))
  );
}

function checkoutResponse(
  request: Request,
  url: string,
  pendingCookie?: string,
  clearEntitlement = false,
): Response {
  const response = wantsJsonResponse(request)
    ? NextResponse.json({ url }, { status: pendingCookie ? 201 : 200 })
    : NextResponse.redirect(url, 303);

  if (pendingCookie) {
    response.cookies.set(VISITOR_COOKIE, pendingCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: PENDING_SESSION_TTL_SECONDS,
    });
  }
  if (clearEntitlement) {
    response.cookies.set(ENTITLEMENT_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function POST(request: Request): Promise<Response> {
  const config = getBillingConfig();
  if (!config) return billingNoticeResponse("setup", 503);

  if (!isSameAppOrigin(request, config.appUrl)) {
    return billingNoticeResponse("invalid", 403);
  }

  const plan = await requestedPlan(request);
  if (!isPaidPlanId(plan)) return billingNoticeResponse("invalid", 400);

  const cookieStore = await cookies();
  const existingEntitlement = readEntitlementCookie(
    cookieStore.get(ENTITLEMENT_COOKIE)?.value,
    config.cookieSecret,
  );
  let expireOldEntitlement = false;
  if (existingEntitlement) {
    try {
      const subscription = await getSubscription(
        config,
        existingEntitlement.subscriptionId,
      );
      if (planForActiveSubscription(subscription, config.priceIds)) {
        return billingNoticeResponse("already", 409);
      }
      if (
        subscription.status === "active" ||
        subscription.status === "trialing"
      ) {
        // Fail closed for an active subscription with an unknown price. Starting
        // another subscription here could leave the browser paying twice.
        return billingNoticeResponse("service", 503);
      }
      expireOldEntitlement = true;
    } catch {
      return billingNoticeResponse("service", 503);
    }
  }

  const visitorCookie = cookieStore.get(VISITOR_COOKIE)?.value;
  const visitorBinding = readVisitorCookie(visitorCookie, config.cookieSecret);
  if (!visitorBinding) return billingNoticeResponse("invalid", 409);
  const visitorId = visitorBinding.id;
  const existingSessionId = visitorBinding?.checkoutSessionId ?? null;

  if (existingSessionId) {
    try {
      const session = await getCheckoutSession(config, existingSessionId);
      if (session.client_reference_id !== visitorId) {
        return billingNoticeResponse("invalid", 403);
      }

      let canStartNewSession = session.status === "expired";
      if (session.status === "open") {
        if (visitorBinding?.plan === plan) {
          if (
            !session.url ||
            !isStripeHostedUrl(session.url, "checkout.stripe.com")
          ) {
            return billingNoticeResponse("service", 503);
          }
          return checkoutResponse(
            request,
            session.url,
            undefined,
            expireOldEntitlement,
          );
        }

        try {
          const expired = await expireCheckoutSession(
            config,
            existingSessionId,
          );
          if (expired.status !== "expired") {
            return billingNoticeResponse("service", 503);
          }
          canStartNewSession = true;
        } catch {
          // Checkout can complete while this request is expiring it. Re-read
          // Stripe's state before deciding whether a different plan is safe.
          const latest = await getCheckoutSession(config, existingSessionId);
          if (
            latest.status === "complete" &&
            latest.payment_status === "paid"
          ) {
            const successUrl = new URL("/billing/success", config.appUrl);
            successUrl.searchParams.set("session_id", latest.id);
            return checkoutResponse(
              request,
              successUrl.toString(),
              undefined,
              expireOldEntitlement,
            );
          }
          if (latest.status !== "expired") {
            return billingNoticeResponse("service", 503);
          }
          canStartNewSession = true;
        }
      }

      if (session.status === "complete" && session.payment_status === "paid") {
        const successUrl = new URL("/billing/success", config.appUrl);
        successUrl.searchParams.set("session_id", session.id);
        return checkoutResponse(
          request,
          successUrl.toString(),
          undefined,
          expireOldEntitlement,
        );
      }

      if (!canStartNewSession) {
        return billingNoticeResponse("payment", 409);
      }
    } catch {
      return billingNoticeResponse("service", 503);
    }
  }

  try {
    const session = await createCheckoutSession(
      config,
      plan,
      visitorId,
      existingSessionId ?? "initial",
    );
    const pendingCookie = createPendingVisitorCookie(
      visitorId,
      session.id,
      plan,
      config.cookieSecret,
    );
    return checkoutResponse(
      request,
      session.url,
      pendingCookie,
      expireOldEntitlement,
    );
  } catch {
    return billingNoticeResponse("service", 503);
  }
}
