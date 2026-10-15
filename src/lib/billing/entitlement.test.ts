jest.mock("server-only", () => ({}));
jest.mock("next/headers", () => ({ cookies: jest.fn() }));

import {
  createEntitlementCookie,
  createPendingVisitorCookie,
  createVisitorIdentity,
  pendingCheckoutPlan,
  pendingCheckoutSessionId,
  readEntitlementCookie,
  verifyVisitorCookie,
  ENTITLEMENT_TTL_SECONDS,
} from "./entitlement";

const secret = "local-test-signing-key-that-is-at-least-32-bytes";
const now = 1_700_000_000_000;

describe("browser-local billing credentials", () => {
  it("verifies a visitor binding and rejects a forged binding", () => {
    const visitor = createVisitorIdentity(secret);
    expect(verifyVisitorCookie(visitor.cookie, secret)).toBe(visitor.id);
    expect(verifyVisitorCookie(visitor.cookie, `${secret}-changed`)).toBeNull();
  });

  it("binds the pending visitor cookie to one Stripe Checkout Session", () => {
    const visitor = createVisitorIdentity(secret);
    const pendingCookie = createPendingVisitorCookie(
      visitor.id,
      "cs_test_session123",
      "starter",
      secret,
    );
    expect(verifyVisitorCookie(pendingCookie, secret)).toBe(visitor.id);
    expect(pendingCheckoutSessionId(pendingCookie, secret)).toBe(
      "cs_test_session123",
    );
    expect(pendingCheckoutPlan(pendingCookie, secret)).toBe("starter");
    expect(pendingCheckoutSessionId(visitor.cookie, secret)).toBeNull();
  });

  it("accepts a signed active-plan cookie and rejects a forged one", () => {
    const entitlement = createEntitlementCookie(
      "sub_abc123",
      "pro",
      secret,
      now,
    );
    expect(readEntitlementCookie(entitlement.value, secret, now)).toEqual({
      subscriptionId: "sub_abc123",
      plan: "pro",
      expiresAt: Math.floor(now / 1000) + ENTITLEMENT_TTL_SECONDS,
    });

    const [payload, signature] = entitlement.value.split(".");
    const first = signature?.[0] === "A" ? "B" : "A";
    const forged = `${payload}.${first}${signature?.slice(1)}`;
    expect(readEntitlementCookie(forged, secret, now)).toBeNull();
  });

  it("rejects an expired entitlement cookie", () => {
    const entitlement = createEntitlementCookie(
      "sub_abc123",
      "starter",
      secret,
      now,
    );
    expect(
      readEntitlementCookie(
        entitlement.value,
        secret,
        now + (ENTITLEMENT_TTL_SECONDS + 1) * 1000,
      ),
    ).toBeNull();
  });
});
