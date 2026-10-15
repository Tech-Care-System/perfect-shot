export type PlanId = "free" | "starter" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "A complete on-device pose coach.",
    features: [
      "All 13 poses across 4 scenes",
      "Live pose outline and visual corrections",
      "Framing, lighting, distance, and smart shutter guidance",
      "Capture and save photos on your device",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 5,
    description: "Hear live corrections while you pose.",
    features: ["Everything in Free", "Spoken live pose corrections"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 12,
    description: "Get spoken guidance from setup through capture.",
    features: [
      "Everything in Starter",
      "Spoken introductions for each pose",
      "Spoken framing, lighting, and distance guidance",
    ],
  },
];

export function isPaidPlanId(value: unknown): value is Exclude<PlanId, "free"> {
  return value === "starter" || value === "pro";
}
