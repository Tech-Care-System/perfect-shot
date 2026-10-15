/** @jest-environment node */

jest.mock("server-only", () => ({}));

import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { getBillingConfig } from "@/lib/billing/stripe";
import { readVisitorCookie, VISITOR_COOKIE } from "@/lib/billing/entitlement";

jest.mock("@/lib/billing/stripe", () => ({
  ...jest.requireActual("@/lib/billing/stripe"),
  getBillingConfig: jest.fn(),
}));

const billing = {
  secretKey: "sk_test_fixture",
  priceIds: { starter: "price_starter", pro: "price_pro" },
  appUrl: new URL("https://perfect-shot.example"),
  cookieSecret: "fixture-secret-with-at-least-32-bytes",
};

describe("checkout browser identity", () => {
  beforeEach(() => jest.mocked(getBillingConfig).mockReturnValue(billing));

  it("sets a signed private cookie before the pricing page is shown and preserves it on reload", () => {
    const response = proxy(new NextRequest("https://perfect-shot.example/"));
    const identity = response.cookies.get(VISITOR_COOKIE);
    expect(
      readVisitorCookie(identity?.value, billing.cookieSecret)?.id,
    ).toBeTruthy();
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("cache-control")).toBe("private, no-store");

    const reload = proxy(
      new NextRequest("https://perfect-shot.example/", {
        headers: { cookie: `${VISITOR_COOKIE}=${identity?.value}` },
      }),
    );
    expect(reload.cookies.get(VISITOR_COOKIE)).toBeUndefined();
  });

  it("does not create a billing cookie when payment configuration is absent", () => {
    jest.mocked(getBillingConfig).mockReturnValue(null);
    expect(
      proxy(new NextRequest("https://perfect-shot.example/")).cookies.get(
        VISITOR_COOKIE,
      ),
    ).toBeUndefined();
  });
});
