jest.mock("server-only", () => ({}));

import {
  createBillingPortalSession,
  createCheckoutSession,
  planForActiveSubscription,
  verifiedCheckoutPlan,
  type BillingConfig,
  type PaidPlanId,
  type StripePrice,
  type StripeCheckoutSession,
  type StripeSubscription,
} from "./stripe";

const priceIds = { starter: "price_starter123", pro: "price_pro123" };
const visitorId = "V".repeat(43);
const config: BillingConfig = {
  secretKey: "sk_test_local",
  priceIds,
  appUrl: new URL("https://perfect-shot.example/"),
  cookieSecret: "local-test-signing-key-that-is-at-least-32-bytes",
};

function monthlyPrice(
  plan: PaidPlanId,
  overrides: Partial<StripePrice> = {},
): StripePrice {
  const unitAmount = plan === "starter" ? 500 : 1_200;
  const base: StripePrice = {
    id: priceIds[plan],
    object: "price",
    active: true,
    billing_scheme: "per_unit",
    currency: "usd",
    unit_amount: unitAmount,
    unit_amount_decimal: String(unitAmount),
    type: "recurring",
    recurring: { interval: "month", interval_count: 1, usage_type: "licensed" },
    custom_unit_amount: null,
    tiers_mode: null,
    transform_quantity: null,
  };

  return {
    ...base,
    ...overrides,
    recurring:
      overrides.recurring === null
        ? null
        : { ...base.recurring!, ...overrides.recurring },
  };
}

function stripeResponse(payload: unknown): Response {
  return {
    ok: true,
    json: async () => payload,
    body: { cancel: jest.fn().mockResolvedValue(undefined) },
  } as unknown as Response;
}

function checkoutResponse() {
  return stripeResponse({
    id: "cs_test_abc123",
    url: "https://checkout.stripe.com/c/pay/cs_test_abc123",
  });
}

function idempotencyKey(request: RequestInit | undefined): string | undefined {
  return (request?.headers as Record<string, string> | undefined)?.["Idempotency-Key"];
}

const invalidPriceCases: ReadonlyArray<{
  label: string;
  overrides: Partial<StripePrice>;
}> = [
  { label: "inactive", overrides: { active: false } },
  { label: "unexpected configured ID", overrides: { id: "price_other123" } },
  { label: "wrong amount", overrides: { unit_amount: 499, unit_amount_decimal: "499" } },
  { label: "wrong currency", overrides: { currency: "eur" } },
  {
    label: "annual interval",
    overrides: { recurring: { interval: "year", interval_count: 1, usage_type: "licensed" } },
  },
  {
    label: "wrong interval count",
    overrides: { recurring: { interval: "month", interval_count: 12, usage_type: "licensed" } },
  },
  { label: "one-time price", overrides: { type: "one_time", recurring: null } },
  { label: "tiered price", overrides: { billing_scheme: "tiered" } },
  {
    label: "metered price",
    overrides: { recurring: { interval: "month", interval_count: 1, usage_type: "metered" } },
  },
  { label: "custom amount", overrides: { custom_unit_amount: { enabled: true } } },
  { label: "transformed quantity", overrides: { transform_quantity: { divide_by: 2, round: "up" } } },
];

function subscription(
  status = "active",
  price: string | { id: string } = priceIds.starter,
): StripeSubscription {
  return {
    id: "sub_abc123",
    status,
    customer: "cus_abc123",
    items: { data: [{ price, quantity: 1 }] },
  };
}

function checkoutSession(
  overrides: Partial<StripeCheckoutSession> = {},
): StripeCheckoutSession {
  return {
    id: "cs_test_abc123",
    status: "complete",
    payment_status: "paid",
    mode: "subscription",
    client_reference_id: "browser-binding",
    subscription: "sub_abc123",
    url: null,
    ...overrides,
  };
}

describe("billing plan verification", () => {
  it("creates Checkout with the server-configured price and fixed return URLs", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(stripeResponse(monthlyPrice("pro")))
      .mockResolvedValueOnce(checkoutResponse());
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await createCheckoutSession(config, "pro", visitorId);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
        "https://api.stripe.com/v1/prices/price_pro123",
      );
      expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("GET");
      expect(fetchMock.mock.calls[0]?.[1]?.body).toBeUndefined();

      const request = fetchMock.mock.calls[1]?.[1];
      const form = new URLSearchParams(request?.body as string);

      expect(form.get("mode")).toBe("subscription");
      expect(form.get("line_items[0][price]")).toBe(priceIds.pro);
      expect(form.get("line_items[0][quantity]")).toBe("1");
      expect(form.get("client_reference_id")).toBe(visitorId);
      expect(form.get("success_url")).toBe(
        "https://perfect-shot.example/billing/success?session_id={CHECKOUT_SESSION_ID}",
      );
      expect(form.get("cancel_url")).toBe(
        "https://perfect-shot.example/#pricing",
      );
      expect(idempotencyKey(request)).toMatch(
        /^ai-perfect-shot-checkout-[a-f0-9]{64}$/,
      );
    } finally {
      if (originalFetch) globalThis.fetch = originalFetch;
      else Reflect.deleteProperty(globalThis, "fetch");
    }
  });

  it("creates a Customer Portal session with a fixed return URL", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "bps_abc123",
        url: "https://billing.stripe.com/p/session/test_abc123",
      }),
    } as Response);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await createBillingPortalSession(config, "cus_abc123");
      const request = fetchMock.mock.calls[0]?.[1];
      const form = new URLSearchParams(request?.body as string);

      expect(form.get("customer")).toBe("cus_abc123");
      expect(form.get("return_url")).toBe(
        "https://perfect-shot.example/camera",
      );
      expect(idempotencyKey(request)).toBeUndefined();
    } finally {
      if (originalFetch) globalThis.fetch = originalFetch;
      else Reflect.deleteProperty(globalThis, "fetch");
    }
  });

  it.each(invalidPriceCases)("rejects a configured price with $label before Checkout", async ({ overrides }) => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(stripeResponse(monthlyPrice("starter", overrides)))
      .mockResolvedValueOnce(checkoutResponse());
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await expect(
        createCheckoutSession(config, "starter", visitorId),
      ).rejects.toThrow("stripe_unavailable");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("GET");
    } finally {
      if (originalFetch) globalThis.fetch = originalFetch;
      else Reflect.deleteProperty(globalThis, "fetch");
    }
  });

  it("uses one idempotency key per visitor and generation, regardless of plan", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(stripeResponse(monthlyPrice("starter")))
      .mockResolvedValueOnce(checkoutResponse())
      .mockResolvedValueOnce(stripeResponse(monthlyPrice("pro")))
      .mockResolvedValueOnce(checkoutResponse())
      .mockResolvedValueOnce(stripeResponse(monthlyPrice("starter")))
      .mockResolvedValueOnce(checkoutResponse());
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await createCheckoutSession(config, "starter", visitorId);
      await createCheckoutSession(config, "pro", visitorId);
      await createCheckoutSession(config, "starter", visitorId, "cs_test_expired123");
      expect(fetchMock).toHaveBeenCalledTimes(6);
      expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/prices/price_starter123");
      expect(String(fetchMock.mock.calls[2]?.[0])).toContain("/prices/price_pro123");
      expect(String(fetchMock.mock.calls[4]?.[0])).toContain("/prices/price_starter123");

      const firstKey = idempotencyKey(fetchMock.mock.calls[1]?.[1]);
      const differentPlanKey = idempotencyKey(fetchMock.mock.calls[3]?.[1]);
      const nextGenerationKey = idempotencyKey(fetchMock.mock.calls[5]?.[1]);
      const firstForm = new URLSearchParams(fetchMock.mock.calls[1]?.[1]?.body as string);
      const differentPlanForm = new URLSearchParams(fetchMock.mock.calls[3]?.[1]?.body as string);

      expect(firstKey).toBe(differentPlanKey);
      expect(nextGenerationKey).not.toBe(firstKey);
      expect(firstForm.get("line_items[0][price]")).toBe(priceIds.starter);
      expect(differentPlanForm.get("line_items[0][price]")).toBe(priceIds.pro);
    } finally {
      if (originalFetch) globalThis.fetch = originalFetch;
      else Reflect.deleteProperty(globalThis, "fetch");
    }
  });

  it("rejects invalid visitor IDs or checkout generations before Stripe calls", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await expect(createCheckoutSession(config, "starter", "not-a-visitor")).rejects.toThrow(
        "invalid_checkout_generation",
      );
      await expect(createCheckoutSession(config, "starter", visitorId, "not-a-session")).rejects.toThrow(
        "invalid_checkout_generation",
      );
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      if (originalFetch) globalThis.fetch = originalFetch;
      else Reflect.deleteProperty(globalThis, "fetch");
    }
  });

  it("grants only the configured subscription price", () => {
    expect(planForActiveSubscription(subscription(), priceIds)).toBe("starter");
    expect(
      planForActiveSubscription(
        subscription("active", { id: priceIds.pro }),
        priceIds,
      ),
    ).toBe("pro");
    expect(
      planForActiveSubscription(
        subscription("active", "price_unknown"),
        priceIds,
      ),
    ).toBeNull();
  });

  it("rejects an unpaid checkout session", () => {
    expect(
      verifiedCheckoutPlan(
        checkoutSession({ payment_status: "unpaid" }),
        subscription(),
        "browser-binding",
        priceIds,
      ),
    ).toBeNull();
  });

  it("rejects a browser-binding mismatch", () => {
    expect(
      verifiedCheckoutPlan(
        checkoutSession(),
        subscription(),
        "different-browser",
        priceIds,
      ),
    ).toBeNull();
  });

  it("rejects a canceled subscription even if the Checkout session was paid", () => {
    expect(
      verifiedCheckoutPlan(
        checkoutSession(),
        subscription("canceled"),
        "browser-binding",
        priceIds,
      ),
    ).toBeNull();
  });
});
