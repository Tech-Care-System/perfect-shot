import {
  billingNoticeResponse,
  type BillingNotice,
} from "@/lib/billing/responses";

const NOTICES = new Set<BillingNotice>([
  "setup",
  "invalid",
  "payment",
  "service",
  "already",
]);

export async function GET(request: Request): Promise<Response> {
  const state = new URL(request.url).searchParams.get("state");
  if (!state || !NOTICES.has(state as BillingNotice)) {
    return billingNoticeResponse("invalid", 400);
  }

  const status = state === "setup" || state === "service" ? 503 : 200;
  return billingNoticeResponse(state as BillingNotice, status);
}
