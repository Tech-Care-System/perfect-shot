const NOTICES = {
  setup: {
    title: "Checkout is unavailable right now",
    message:
      "You can still use the complete Free camera. Please try checkout again later.",
  },
  invalid: {
    title: "This checkout link could not be verified",
    message:
      "Return to Perfect Shot and start checkout again from this browser.",
  },
  payment: {
    title: "Payment was not confirmed",
    message: "No paid access was activated. Return to plans to try again.",
  },
  service: {
    title: "Billing is temporarily unavailable",
    message: "Your plan was not changed. Please try again in a moment.",
  },
  already: {
    title: "A paid plan is already active in this browser",
    message:
      "Your current plan remains active. You can change or cancel it in the billing portal.",
  },
} as const;

export type BillingNotice = keyof typeof NOTICES;

export function billingNoticeResponse(
  notice: BillingNotice,
  status = 200,
): Response {
  const content = NOTICES[notice];
  const manageBilling =
    notice === "already"
      ? '<form action="/api/billing-portal" method="post"><button type="submit" style="border:0;border-radius:999px;background:#315644;color:#fff;padding:.8rem 1.2rem;font:inherit;cursor:pointer">Manage billing</button></form>'
      : "";
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${content.title} · Perfect Shot</title>
  </head>
  <body style="margin:0;background:#f7f4ef;color:#24231f;font:16px/1.5 system-ui,sans-serif">
    <main style="max-width:36rem;margin:12vh auto;padding:2rem">
      <p style="color:#6e705d;letter-spacing:.12em;text-transform:uppercase;font-size:1rem">Perfect Shot</p>
      <h1 style="font-size:2rem;line-height:1.15">${content.title}</h1>
      <p>${content.message}</p>
      ${manageBilling}
      <p><a href="/camera" style="color:#315644">Continue with Free</a></p>
      <p><a href="/#pricing" style="color:#315644">Back to plans</a></p>
    </main>
  </body>
</html>`;

  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export function isSameAppOrigin(request: Request, appUrl: URL): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;

  try {
    const parsed = new URL(origin);
    return parsed.origin === appUrl.origin && origin === parsed.origin;
  } catch {
    return false;
  }
}

export function billingStatusRedirect(
  appUrl: URL,
  notice: BillingNotice,
): Response {
  const url = new URL("/billing/status", appUrl);
  url.searchParams.set("state", notice);
  const response = Response.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
