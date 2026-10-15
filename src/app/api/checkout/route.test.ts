/** @jest-environment node */

jest.mock("server-only", () => ({}));
jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("@/lib/billing/stripe", () => ({
  ...jest.requireActual("@/lib/billing/stripe"),
  getBillingConfig: jest.fn(),
  createCheckoutSession: jest.fn(),
  getCheckoutSession: jest.fn(),
}));

import { cookies } from "next/headers";
import { POST } from "./route";
import {
  createPendingVisitorCookie,
  createVisitorIdentity,
  VISITOR_COOKIE,
} from "@/lib/billing/entitlement";
import {
  createCheckoutSession,
  getBillingConfig,
  getCheckoutSession,
} from "@/lib/billing/stripe";

const billing = {
  secretKey: "sk_test_fixture",
  priceIds: { starter: "price_starter", pro: "price_pro" },
  appUrl: new URL("https://perfect-shot.example"),
  cookieSecret: "fixture-secret-with-at-least-32-bytes",
};
let visitorCookie: string | undefined;

function request(origin = billing.appUrl.origin) {
  return new Request("https://perfect-shot.example/api/checkout", {
    method: "POST",
    headers: { origin, "content-type": "application/x-www-form-urlencoded" },
    body: "plan=starter",
  });
}

describe("checkout request binding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    visitorCookie = undefined;
    jest.mocked(getBillingConfig).mockReturnValue(billing);
    jest.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        name === VISITOR_COOKIE && visitorCookie
          ? { name, value: visitorCookie }
          : undefined,
    } as Awaited<ReturnType<typeof cookies>>);
    jest
      .mocked(createCheckoutSession)
      .mockResolvedValue({
        id: "cs_test_new123",
        url: "https://checkout.stripe.com/c/pay/cs_test_new123",
      });
  });

  it("rejects checkout without the pre-established browser cookie before calling Stripe", async () => {
    expect((await POST(request())).status).toBe(409);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("passes a stable visitor and generation for repeated submissions", async () => {
    const identity = createVisitorIdentity(billing.cookieSecret);
    visitorCookie = identity.cookie;
    const responses = await Promise.all([POST(request()), POST(request())]);
    expect(responses.map((response) => response.status)).toEqual([303, 303]);
    for (const call of jest.mocked(createCheckoutSession).mock.calls) {
      expect(call).toEqual([billing, "starter", identity.id, "initial"]);
    }
    expect(responses[0].headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("reuses a pending Checkout instead of creating another subscription", async () => {
    const identity = createVisitorIdentity(billing.cookieSecret);
    visitorCookie = createPendingVisitorCookie(
      identity.id,
      "cs_test_existing123",
      "starter",
      billing.cookieSecret,
    );
    jest.mocked(getCheckoutSession).mockResolvedValue({
      id: "cs_test_existing123",
      status: "open",
      payment_status: "unpaid",
      mode: "subscription",
      client_reference_id: identity.id,
      subscription: null,
      url: "https://checkout.stripe.com/c/pay/cs_test_existing123",
    });
    const response = await POST(request());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("cs_test_existing123");
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects cross-origin submissions before calling Stripe", async () => {
    visitorCookie = createVisitorIdentity(billing.cookieSecret).cookie;
    expect((await POST(request("https://elsewhere.example"))).status).toBe(403);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });
});
