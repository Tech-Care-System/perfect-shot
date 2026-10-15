# Billing MVP

Perfect Shot uses Stripe Checkout for a browser-local monthly subscription. The Free plan keeps the current on-device camera features. Starter adds the finite spoken live-correction catalog; Pro adds spoken pose introductions and framing, lighting, and distance cues. These are product tiers, not usage quotas.

## Stripe setup

Create two recurring monthly prices in Stripe and configure these server-only values:

| Variable                  | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`       | Stripe test or live secret key (`sk_test_...` / `sk_live_...`)               |
| `STRIPE_STARTER_PRICE_ID` | Starter monthly Price ID (`price_...`)                                       |
| `STRIPE_PRO_PRICE_ID`     | Pro monthly Price ID (`price_...`), distinct from Starter                    |
| `APP_URL`                 | App origin, such as `https://perfectshot.example`; production requires HTTPS |
| `BILLING_COOKIE_SECRET`   | At least 32 random bytes used to sign browser-local billing cookies          |

For local work, use Stripe test mode and an `APP_URL` on `http://localhost` or `http://127.0.0.1`. Generate a new cookie secret for each deployment, for example with `openssl rand -base64 32`. Keep all five values in the deployment's secret manager; never expose them through `NEXT_PUBLIC_` variables.

Checkout is created server-side with a fixed configured Price, one quantity, subscription mode, and card payments. Stripe Price metadata must match the displayed USD $5/$12 licensed monthly per-unit plans before checkout can start. The homepage establishes a signed anonymous browser identity before submissions; requests without it are rejected. Stripe idempotency keys bind concurrent submissions to that visitor and pending-session generation, including when two tabs select different plans. The browser can choose only `starter` or `pro`; it cannot submit a price, amount, success URL, or cancel URL. Stripe's Checkout Session creation and retrieval APIs are documented at [Create a Checkout Session](https://docs.stripe.com/api/checkout/sessions/create) and [Retrieve a Checkout Session](https://docs.stripe.com/api/checkout/sessions/retrieve).

Enable the Stripe Customer Portal before relying on the Manage billing action. Configure cancellation and, if desired, plan switching only between the two configured prices. The portal route rechecks the active subscription and configured price before creating a portal session; Stripe's API uses the existing customer and a fixed app return URL ([Create a portal session](https://docs.stripe.com/api/customer_portal/sessions/create)).

## Activation and limits

The return route activates a plan only after retrieving the Checkout Session and its subscription from Stripe, checking the completed and paid session, the browser binding, and the active subscription's configured Price. It then issues a signed, HTTP-only cookie containing only the subscription ID, plan ID, and expiry. The app rechecks subscription state on server requests and caches that check for at most 60 seconds. Stripe is the source of truth; changing a browser cookie cannot grant a plan.

There are no accounts, database, webhooks, or cross-device restore flow in this MVP. The entitlement belongs to the browser that completed Checkout. The rolling cookie lasts 30 days and is renewed while that browser uses the app; after it expires, access must be restored through a future account or support flow. A signed browser cookie tracks one pending Checkout Session and its selected plan for up to 24 hours. Repeating the same plan resumes that session; choosing another plan first expires the previous open session through Stripe ([Expire a Checkout Session](https://docs.stripe.com/api/checkout/sessions/expire)). The success route requires that same session binding. A browser with an active subscription is sent to the Customer Portal instead of creating another subscription.

Local Stripe sandbox verification passed for both configured USD monthly prices, Checkout creation, repeated-session reuse, and expiration of the old session when switching plans. Those initial test sessions were expired afterward. A separate Pro subscription completed with Stripe's public test Visa, returned to `/camera`, and activated server-verified Pro access in the same browser. The paid voice endpoint then returned MPEG audio successfully. The default sandbox Customer Portal was saved and opened through the app's portal route; it displayed Pro at USD $12/month, a paid invoice, payment details, and a cancellation control. Cancellation is configured for period end and was not performed, leaving the test subscription available for the demo. No live payment was made. Before launch, verify the cancellation flow and configure live-mode credentials and portal settings separately; plan switching also requires a portal configuration if enabled.
