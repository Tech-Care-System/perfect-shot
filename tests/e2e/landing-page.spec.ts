import { expect, test } from "@playwright/test";

type WindowWithMediaCounter = Window & { getUserMediaCalls?: number };

test.describe("Landing page", () => {
  test("keeps camera access on the camera route and supports the page controls", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const testWindow = window as WindowWithMediaCounter;
      testWindow.getUserMediaCalls = 0;

      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: () => {
          testWindow.getUserMediaCalls =
            (testWindow.getUserMediaCalls ?? 0) + 1;
          return Promise.reject(
            new Error("Camera access should start on /camera"),
          );
        },
      });
    });

    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Be yourself\.\s*Nail the shot\./i,
      }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "Open camera", exact: true })
        .first(),
    ).toHaveAttribute("href", "/camera");

    const heroImage = page.getByRole("img", {
      name: "A woman standing naturally in warm sunlight beside a limestone colonnade",
    });
    await expect(heroImage).toBeVisible();
    await expect
      .poll(() =>
        heroImage.evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        heroImage.evaluate((image) => (image as HTMLImageElement).currentSrc),
      )
      .toContain("/_next/image");

    const poseLibraryLink = page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Pose library" });
    await poseLibraryLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#pose-library$/);
    await expect(page.locator("#pose-library")).toBeVisible();

    const getUserMediaCalls = await page.evaluate(
      () => (window as WindowWithMediaCounter).getUserMediaCalls ?? 0,
    );
    expect(getUserMediaCalls).toBe(0);
  });

  test("does not overflow horizontally at phone and desktop widths", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Be yourself\.\s*Nail the shot\./i,
      }),
    ).toBeVisible();

    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const { clientWidth, scrollWidth } = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));

      expect(
        scrollWidth,
        `horizontal overflow at ${width}px`,
      ).toBeLessThanOrEqual(clientWidth);
    }
  });

  test("keeps text at 1rem or larger and exposes pricing in the phone menu", async ({
    page,
  }) => {
    await page.goto("/");
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const undersizedText = await page
        .locator("header, main, footer")
        .evaluateAll((roots) =>
          roots
            .flatMap((root) => [root, ...root.querySelectorAll("*")])
            .filter(
              (element) =>
                element.getClientRects().length > 0 &&
                Array.from(element.childNodes).some(
                  (node) =>
                    node.nodeType === Node.TEXT_NODE &&
                    node.textContent?.trim(),
                ) &&
                parseFloat(getComputedStyle(element).fontSize) < 16,
            )
            .map((element) => ({
              text: element.textContent?.trim().slice(0, 60),
              size: getComputedStyle(element).fontSize,
            })),
        );
      expect(undersizedText, `text below 1rem at ${width}px`).toEqual([]);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("header details summary").click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Pricing", exact: true })
      .click();
    await expect(page).toHaveURL(/#pricing$/);
    for (const name of ["Free", "Starter", "Pro"]) {
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
    }
  });
});
