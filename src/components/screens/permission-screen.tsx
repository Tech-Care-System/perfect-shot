"use client";

import styles from "@/components/camera/camera-ui.module.css";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/lib/hooks/use-camera";
import type {
  CameraError,
  CameraPermissionStatus,
} from "@/lib/types/camera.types";
import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export interface PermissionScreenProps {
  permissionStatus?: CameraPermissionStatus;
  requestPermission?: () => Promise<boolean>;
  checkPermission?: (silent?: boolean) => Promise<CameraPermissionStatus>;
  error?: CameraError | null;
}

interface PermissionScreenCoreProps extends PermissionScreenProps {
  permissionStatus: CameraPermissionStatus;
  requestPermission: () => Promise<boolean>;
  checkPermission: (silent?: boolean) => Promise<CameraPermissionStatus>;
}

function PermissionScreenCore({
  permissionStatus,
  requestPermission,
  checkPermission,
  error,
}: PermissionScreenCoreProps) {
  const [pending, setPending] = useState(false);
  const denied = permissionStatus === "denied";
  const handleContinue = async () => {
    if (pending) return;
    setPending(true);
    try {
      if (denied) await checkPermission(false);
      else await requestPermission();
    } finally {
      setPending(false);
    }
  };

  if (permissionStatus === "granted") return null;
  const errorText =
    error?.code === "NOT_FOUND"
      ? "No camera was found. Connect a camera and try again."
      : error?.code === "NOT_READABLE"
        ? "Your camera may be in use. Close other camera apps and try again."
        : "We couldn’t open your camera. Check your browser’s camera permissions and try again.";

  return (
    <div className={styles.permission} aria-busy={pending}>
      <header className={styles.permissionHeader}>
        <Link href="/" className={styles.brand} aria-label="Perfect Shot home">
          <Image
            src="/icon-192.png"
            width={28}
            height={28}
            alt=""
            unoptimized
            className={styles.brandIcon}
          />
          <span>
            perfect<span className={styles.brandLight}>shot</span>
          </span>
        </Link>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" /> Back to home
        </Link>
      </header>
      <div className={styles.permissionContent}>
        <section className={"permission-screen " + styles.permissionIntro}>
          <p className={styles.eyebrow}>
            <Camera size={20} aria-hidden="true" /> THE CAMERA STUDIO
          </p>
          <h1 className={styles.permissionTitle}>
            {denied ? (
              "Camera Access Needed"
            ) : (
              <>
                Your camera.
                <br />
                <em>A little direction.</em>
              </>
            )}
          </h1>
          <p className={styles.description}>
            {denied
              ? "Allow your camera in your browser, then come back here."
              : "Turn on your camera for live pose, framing and lighting guidance."}
          </p>
          {denied && (
            <ol className={styles.permissionSteps}>
              <li>Open this site’s camera permissions in your browser.</li>
              <li>Allow camera access for this site.</li>
              <li>Return to this page.</li>
              <li>Select Check Again below.</li>
            </ol>
          )}
          {!denied && error && (
            <p role="alert" className={styles.permissionError}>
              {errorText}
            </p>
          )}
          <Button
            size="lg"
            className={styles.primaryButton}
            onClick={handleContinue}
            disabled={pending}
          >
            {denied
              ? pending
                ? "Checking..."
                : "Check Again"
              : pending
                ? "Requesting..."
                : "Grant Camera Access"}
            {denied ? (
              <RefreshCw size={18} aria-hidden="true" />
            ) : (
              <ArrowUpRight size={18} aria-hidden="true" />
            )}
          </Button>
          <p className={styles.cameraOnly}>
            Camera only. No microphone access.
          </p>
          <p className={styles.permissionPrivacy}>
            <ShieldCheck size={20} aria-hidden="true" />
            <span>Your photos never leave your device</span>
          </p>
          <Link href="/#pricing" className={styles.pricingLink}>
            Free to start. Explore voice coaching plans{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
        <aside
          className={styles.permissionReference}
          aria-label="Pose inspiration"
        >
          <Image
            src="/images/landing/pose-chair.png"
            alt="A relaxed seated pose in soft café light"
            fill
            sizes="(max-width: 767px) 0px, 45vw"
            className={styles.referenceImage}
          />
          <span className={styles.referenceLabel}>POSE INSPIRATION</span>
          <p className={styles.referenceCaption}>
            Less guessing.
            <br />
            <em>More you.</em>
          </p>
        </aside>
      </div>
    </div>
  );
}

function PermissionScreenWithHook(props: PermissionScreenProps) {
  const camera = useCamera();
  return (
    <PermissionScreenCore
      permissionStatus={props.permissionStatus ?? camera.permissionStatus}
      requestPermission={props.requestPermission ?? camera.requestPermission}
      checkPermission={props.checkPermission ?? camera.checkPermission}
      error={props.error ?? camera.error}
    />
  );
}

export function PermissionScreen(props: PermissionScreenProps = {}) {
  if (
    props.permissionStatus &&
    props.requestPermission &&
    props.checkPermission
  ) {
    return (
      <PermissionScreenCore
        {...props}
        permissionStatus={props.permissionStatus}
        requestPermission={props.requestPermission}
        checkPermission={props.checkPermission}
      />
    );
  }
  return <PermissionScreenWithHook {...props} />;
}
