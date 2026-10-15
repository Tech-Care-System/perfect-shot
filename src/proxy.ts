import { NextResponse, type NextRequest } from "next/server";
import {
  createVisitorIdentity,
  readVisitorCookie,
  VISITOR_COOKIE,
} from "@/lib/billing/entitlement";
import { getBillingConfig } from "@/lib/billing/stripe";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const billing = getBillingConfig();
  if (!billing || request.method !== "GET") return response;

  // Establish one browser identity before concurrent checkout submissions.
  if (
    !readVisitorCookie(
      request.cookies.get(VISITOR_COOKIE)?.value,
      billing.cookieSecret,
    )
  ) {
    response.cookies.set(
      VISITOR_COOKIE,
      createVisitorIdentity(billing.cookieSecret).cookie,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60,
      },
    );
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: "/" };
