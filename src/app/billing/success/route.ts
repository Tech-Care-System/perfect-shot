import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createEntitlementCookie,
  ENTITLEMENT_COOKIE,
  pendingCheckoutSessionId,
  readEntitlementCookie,
  verifyVisitorCookie,
  VISITOR_COOKIE,
  ENTITLEMENT_TTL_SECONDS,
} from "@/lib/billing/entitlement";
import {
  billingNoticeResponse,
  billingStatusRedirect,
} from "@/lib/billing/responses";
import {
  getBillingConfig,
  getCheckoutSession,
  getSubscription,
  isCheckoutSessionId,
  verifiedCheckoutPlan,
} from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const config = getBillingConfig();
  if (!config) return billingNoticeResponse("setup", 503);

  const requestUrl = new URL(request.url);
  const sessionValues = requestUrl.searchParams.getAll("session_id");
  if (
    sessionValues.length !== 1 ||
    !isCheckoutSessionId(sessionValues[0] ?? "")
  ) {
    return billingStatusRedirect(config.appUrl, "invalid");
  }

  const cookieStore = await cookies();
  const visitorId = verifyVisitorCookie(
    cookieStore.get(VISITOR_COOKIE)?.value,
    config.cookieSecret,
  );
  const boundSessionId = pendingCheckoutSessionId(
    cookieStore.get(VISITOR_COOKIE)?.value,
    config.cookieSecret,
  );
  if (!visitorId || boundSessionId !== sessionValues[0]) {
    return billingStatusRedirect(config.appUrl, "invalid");
  }

  try {
    const session = await getCheckoutSession(config, sessionValues[0]);
    if (typeof session.subscription !== "string") {
      return billingStatusRedirect(config.appUrl, "payment");
    }

    const subscription = await getSubscription(config, session.subscription);
    const plan = verifiedCheckoutPlan(
      session,
      subscription,
      visitorId,
      config.priceIds,
    );
    if (!plan) return billingStatusRedirect(config.appUrl, "payment");

    const existingEntitlement = readEntitlementCookie(
      cookieStore.get(ENTITLEMENT_COOKIE)?.value,
      config.cookieSecret,
    );
    if (
      existingEntitlement &&
      existingEntitlement.subscriptionId !== subscription.id
    ) {
      return billingStatusRedirect(config.appUrl, "already");
    }

    const entitlement = createEntitlementCookie(
      subscription.id,
      plan,
      config.cookieSecret,
    );
    const response = NextResponse.redirect(
      new URL("/camera?billing=success", config.appUrl),
      303,
    );
    response.cookies.set(ENTITLEMENT_COOKIE, entitlement.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ENTITLEMENT_TTL_SECONDS,
    });
    // A completed binding is single-use. A replayed success URL cannot mint
    // a second entitlement after this cookie is removed.
    response.cookies.set(VISITOR_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return billingStatusRedirect(config.appUrl, "service");
  }
}
