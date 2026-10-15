import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844 },
  { name: "1440x900", width: 1440, height: 900 },
] as const;

async function saveScreenshot(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(name) });
}

async function expectReadableAndNoOverflow(page: Page, width: number) {
  const layout = await page.evaluate(() => {
    const undersizedText = [document.body, ...document.body.querySelectorAll("*")]
      .filter(
        (element) =>
          element.getClientRects().length > 0 &&
          Array.from(element.childNodes).some(
            (node) =>
              node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          ) &&
          Number.parseFloat(getComputedStyle(element).fontSize) < 16,
      )
      .map((element) => ({
        text: element.textContent?.trim().slice(0, 60),
        size: getComputedStyle(element).fontSize,
      }));

    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      undersizedText,
    };
  });

  expect(layout.scrollWidth, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(
    layout.clientWidth,
  );
  expect(layout.undersizedText, `visible text below 1rem at ${width}px`).toEqual([]);
}

async function expectTouchTarget(button: Locator, name: string) {
  await expect(button, `${name} should remain visible`).toBeVisible();
  const box = await button.boundingBox();
  expect(box, `${name} should have a measurable target`).not.toBeNull();
  if (!box) return;

  expect(box.width, `${name} target width`).toBeGreaterThanOrEqual(44);
  expect(box.height, `${name} target height`).toBeGreaterThanOrEqual(44);
}

async function expectCameraVideoReady(
  page: Page,
  testInfo?: TestInfo,
  calibrationScreenshot?: string,
) {
  const video = page.getByTestId("camera-video");
  await expect(video).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(
      () =>
        video.evaluate((element) => {
          const media = element as HTMLVideoElement;
          return media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && media.videoWidth > 0;
        }),
      { timeout: 15_000 },
    )
    .toBe(true);
  if (testInfo && calibrationScreenshot) {
    await saveScreenshot(page, testInfo, calibrationScreenshot);
  }
  await expect(page.getByTestId("benchmark-loading")).toBeHidden({ timeout: 15_000 });
}

async function expectPoseHintClearOfShutter(page: Page) {
  const hint = page.getByTestId("pose-hint-card");
  const shutter = page.getByRole("button", { name: "Capture Photo" });
  await expect(hint).toBeVisible();

  const hintBox = await hint.boundingBox();
  const shutterBox = await shutter.boundingBox();
  expect(hintBox).not.toBeNull();
  expect(shutterBox).not.toBeNull();
  if (!hintBox || !shutterBox) return;

  const overlaps =
    hintBox.x < shutterBox.x + shutterBox.width &&
    hintBox.x + hintBox.width > shutterBox.x &&
    hintBox.y < shutterBox.y + shutterBox.height &&
    hintBox.y + hintBox.height > shutterBox.y;
  expect(overlaps, "pose hint should not cover the shutter control").toBe(false);
}

type BrowserDiagnostics = {
  pageErrors: string[];
  consoleErrors: string[];
  mediaPipeInfo: string[];
};
const diagnosticsByPage = new WeakMap<Page, BrowserDiagnostics>();

test.describe("Camera redesign", () => {
  test.beforeEach(async ({ page }) => {
    const diagnostics: BrowserDiagnostics = {
      pageErrors: [],
      consoleErrors: [],
      mediaPipeInfo: [],
    };
    diagnosticsByPage.set(page, diagnostics);
    page.on("pageerror", (error) => {
      if (diagnostics.pageErrors.length < 8) {
        diagnostics.pageErrors.push(error.message.slice(0, 240));
      }
    });
    page.on("console", (message) => {
      const text = message.text();
      // MediaPipe writes this informational TFLite delegate line at error severity.
      if (message.type() === "error") {
        if (text.startsWith("INFO: Created TensorFlow Lite XNNPACK delegate for CPU.")) {
          if (diagnostics.mediaPipeInfo.length < 4) {
            diagnostics.mediaPipeInfo.push(text.slice(0, 240));
          }
        } else if (diagnostics.consoleErrors.length < 12) {
          diagnostics.consoleErrors.push(text.slice(0, 240));
        }
      }
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    const diagnostics = diagnosticsByPage.get(page);
    if (!diagnostics) return;

    await testInfo.attach("browser-errors", {
      body: JSON.stringify(diagnostics, null, 2),
      contentType: "application/json",
    });

    if (testInfo.title.includes("live camera controls")) {
      expect(diagnostics.pageErrors, "uncaught browser page errors").toEqual([]);
      expect(diagnostics.consoleErrors, "browser console errors").toEqual([]);
    }
  });

  for (const viewport of VIEWPORTS) {
    test(`shows an accessible permission screen at ${viewport.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/camera");

      await expect(page.locator("main").first()).toHaveCSS(
        "background-color",
        "rgb(248, 245, 240)",
      );
      await expect(
        page.getByRole("link", { name: "Perfect Shot home", exact: true }),
      ).toHaveAttribute("href", "/");
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Your camera. A little direction.",
        }),
      ).toBeVisible();

      const grantButton = page.getByRole("button", { name: "Grant Camera Access" });
      await expectTouchTarget(grantButton, "Grant Camera Access");
      await expectReadableAndNoOverflow(page, viewport.width);
      await saveScreenshot(page, testInfo, `permission-${viewport.name}.png`);
    });
  }

  test("offers a retry when camera permission is denied without opening real media", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator.permissions, "query", {
        configurable: true,
        value: () => Promise.reject(new Error("Use the media permission fallback in this test")),
      });
      Object.defineProperty(navigator.mediaDevices, "enumerateDevices", {
        configurable: true,
        value: async () => [],
      });
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => {
          throw new DOMException("Permission denied by test", "NotAllowedError");
        },
      });
    });

    await page.goto("/camera");
    await page.getByRole("button", { name: "Grant Camera Access" }).click();
    await expect(
      page.getByRole("heading", { name: "Camera Access Needed" }),
    ).toBeVisible();
    await expect(page.locator("main").first()).toHaveCSS(
      "background-color",
      "rgb(248, 245, 240)",
    );
    await expect(
      page.getByRole("link", { name: "Perfect Shot home", exact: true }),
    ).toHaveAttribute("href", "/");
    await expectReadableAndNoOverflow(page, 390);

    const retryButton = page.getByRole("button", { name: "Check Again" });
    await expectTouchTarget(retryButton, "Check Again");
    await saveScreenshot(page, testInfo, "permission-denied-390x844.png");
    await retryButton.click();
    await expect(
      page.getByRole("heading", { name: "Camera Access Needed" }),
    ).toBeVisible();
    await expect(retryButton).toBeEnabled();
  });

  test("shows a retryable message when no camera is available", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => {
          throw new DOMException("No camera attached in test", "NotFoundError");
        },
      });
    });

    await page.goto("/camera");
    const grantButton = page.getByRole("button", { name: "Grant Camera Access" });
    await grantButton.click();
    const cameraError = page.getByText(
      "No camera was found. Connect a camera and try again.",
      { exact: true },
    );
    await expect(cameraError).toBeVisible();
    await grantButton.click();
    await expect(cameraError).toBeVisible();
    await saveScreenshot(page, testInfo, "missing-camera-390x844.png");
  });

  test("shows a disabled pending state while camera permission is unresolved", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: () => new Promise<MediaStream>(() => {}),
      });
    });

    await page.goto("/camera");
    await page.getByRole("button", { name: "Grant Camera Access" }).click();
    const requestingButton = page.getByRole("button", { name: "Requesting..." });
    await expect(requestingButton).toBeDisabled();
    await saveScreenshot(page, testInfo, "permission-requesting-390x844.png");
  });

  test("keeps live camera controls usable at phone and desktop sizes", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);

    await page.route("**/api/voice", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ configured: false, plan: "free", available: false }),
        });
        return;
      }
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: "Voice is not enabled in this test" }),
      });
    });

    const voicePosts: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/voice") && request.method() === "POST") {
        voicePosts.push(request.url());
      }
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/camera");
    await page.getByRole("button", { name: "Grant Camera Access" }).click();
    await page.getByRole("button", { name: "Start Camera" }).click();
    await expectCameraVideoReady(page, testInfo, "calibrating-390x844.png");

    const video = page.getByTestId("camera-video");
    const shutter = page.getByRole("button", { name: "Capture Photo" });
    const nextPose = page.getByRole("button", { name: "Next Pose" });
    const flipCamera = page.getByRole("button", { name: "Flip Camera" });
    const settingsButton = page.getByRole("button", { name: "Settings" });
    const fitButton = page.getByRole("button", { name: "Show Full Frame" });
    const poseHint = page.getByTestId("pose-hint-card");

    await expect(poseHint).toBeVisible();
    await expectTouchTarget(shutter, "Capture Photo");
    await expectTouchTarget(nextPose, "Next Pose");
    await expectTouchTarget(flipCamera, "Flip Camera");
    await expectTouchTarget(settingsButton, "Settings");
    await expectTouchTarget(fitButton, "Show Full Frame");
    await expectPoseHintClearOfShutter(page);
    await saveScreenshot(page, testInfo, "live-390x844.png");

    const poseBefore = await poseHint.innerText();
    await nextPose.click();
    await expect
      .poll(() => poseHint.innerText(), { timeout: 5_000 })
      .not.toBe(poseBefore);

    await fitButton.click();
    const containButton = page.getByRole("button", { name: "Fill Screen" });
    await expect(containButton).toBeVisible();
    await containButton.click();
    await expect(page.getByRole("button", { name: "Show Full Frame" })).toBeVisible();

    const scaleBeforeFlip = await video.evaluate(
      (element) => getComputedStyle(element).scale,
    );
    await flipCamera.click();
    await expect
      .poll(() => video.evaluate((element) => getComputedStyle(element).scale), {
        timeout: 15_000,
      })
      .toBe(scaleBeforeFlip === "-1 1" ? "1" : "-1 1");
    await expectCameraVideoReady(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await expectReadableAndNoOverflow(page, 1440);
    await expectTouchTarget(shutter, "Capture Photo");
    await expectPoseHintClearOfShutter(page);
    await saveScreenshot(page, testInfo, "live-1440x900.png");

    await settingsButton.focus();
    await page.keyboard.press("Enter");
    const settingsHeading = page.getByRole("heading", { name: "Settings", exact: true });
    await expect(settingsHeading).toBeVisible();
    await expect(settingsHeading).toBeInViewport({ ratio: 1 });

    const liteMode = page.getByRole("switch", { name: "Toggle Lite Mode" });
    await expect(liteMode).toBeInViewport({ ratio: 1 });
    await saveScreenshot(page, testInfo, "settings-1440x900.png");
    const liteModeBefore = await liteMode.getAttribute("aria-checked");
    await liteMode.focus();
    await page.keyboard.press("Space");
    await expect(liteMode).toHaveAttribute(
      "aria-checked",
      liteModeBefore === "true" ? "false" : "true",
    );
    await page.keyboard.press("Escape");
    await expect(settingsHeading).toBeHidden();

    const voiceCoach = page.locator('details[aria-label="Voice coaching controls"]');
    const voiceSummary = voiceCoach.locator("summary");
    await voiceSummary.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("link", { name: "Voice coaching is included in Starter and Pro" }),
    ).toBeVisible();
    await expect(shutter).toBeVisible();
    await saveScreenshot(page, testInfo, "voice-open-1440x900.png");
    await shutter.click();

    const photoPreview = page.getByRole("dialog", { name: "Photo Preview" });
    await expect(photoPreview).toBeVisible();
    await expect(page.getByTestId("preview-image")).toHaveAttribute(
      "src",
      /^data:image\/jpeg;base64,/,
    );
    await saveScreenshot(page, testInfo, "preview-1440x900.png");
    await page.getByRole("button", { name: "Retake" }).click();
    await expect(photoPreview).toBeHidden();
    await expect(shutter).toBeFocused();
    await expectCameraVideoReady(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectReadableAndNoOverflow(page, 390);
    await expectPoseHintClearOfShutter(page);

    await settingsButton.focus();
    await page.keyboard.press("Enter");
    await expect(settingsHeading).toBeVisible();
    await expect(settingsHeading).toBeInViewport({ ratio: 1 });
    const mobileLiteMode = page.getByRole("switch", { name: "Toggle Lite Mode" });
    await expectTouchTarget(mobileLiteMode, "Toggle Lite Mode");
    await expect(mobileLiteMode).toBeInViewport({ ratio: 1 });
    await saveScreenshot(page, testInfo, "settings-390x844.png");
    await page.keyboard.press("Escape");
    await expect(settingsHeading).toBeHidden();

    const mobileVoiceCoach = page.locator('details[aria-label="Voice coaching controls"]');
    await mobileVoiceCoach.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("link", { name: "Voice coaching is included in Starter and Pro" }),
    ).toBeVisible();
    await expectTouchTarget(shutter, "Capture Photo");
    await saveScreenshot(page, testInfo, "live-voice-open-390x844.png");
    await shutter.click();
    await expect(photoPreview).toBeVisible();
    await saveScreenshot(page, testInfo, "preview-390x844.png");
    await page.getByRole("button", { name: "Retake" }).click();
    await expect(photoPreview).toBeHidden();
    await expect(shutter).toBeFocused();

    await expect(voicePosts).toEqual([]);
  });
});
