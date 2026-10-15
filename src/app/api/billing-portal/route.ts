import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createEntitlementCookie,
  ENTITLEMENT_COOKIE,
  readEntitlementCookie,
  ENTITLEMENT_TTL_SECONDS,
} from "@/lib/billing/entitlement";
import {
  billingNoticeResponse,
  billingStatusRedirect,
  isSameAppOrigin,
} from "@/lib/billing/responses";
import {
  createBillingPortalSession,
  getBillingConfig,
  getSubscription,
  planForActiveSubscription,
} from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const config = getBillingConfig();
  if (!config) return billingNoticeResponse("setup", 503);
  if (!isSameAppOrigin(request, config.appUrl)) {
    return billingNoticeResponse("invalid", 403);
  }

  const cookieStore = await cookies();
  const entitlement = readEntitlementCookie(
    cookieStore.get(ENTITLEMENT_COOKIE)?.value,
    config.cookieSecret,
  );
  if (!entitlement) return billingNoticeResponse("invalid", 403);

  try {
    const subscription = await getSubscription(
      config,
      entitlement.subscriptionId,
    );
    const currentPlan = planForActiveSubscription(
      subscription,
      config.priceIds,
    );
    if (!currentPlan) {
      const response = NextResponse.redirect(
        new URL("/billing/status?state=payment", config.appUrl),
        303,
      );
      response.cookies.set(ENTITLEMENT_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const portal = await createBillingPortalSession(config, customerId);
    const response = NextResponse.redirect(portal.url, 303);
    const renewed = createEntitlementCookie(
      entitlement.subscriptionId,
      currentPlan,
      config.cookieSecret,
    );
    response.cookies.set(ENTITLEMENT_COOKIE, renewed.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ENTITLEMENT_TTL_SECONDS,
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return billingStatusRedirect(config.appUrl, "service");
  }
}
