"use client";

import { poseHintAtom } from "@/lib/stores/pose-store";
import styles from "@/components/camera/camera-ui.module.css";
import { useAtomValue } from "jotai";

export function PoseHintCard() {
  const poseHint = useAtomValue(poseHintAtom);

  if (!poseHint) return null;

  return (
    <div
      data-testid="pose-hint-card"
      aria-live="polite"
      role="status"
      className={styles.poseHint}
    >
      <p>{poseHint.name}</p>
      <p>{poseHint.hint}</p>
    </div>
  );
}
