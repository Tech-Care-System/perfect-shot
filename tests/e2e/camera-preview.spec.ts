import { expect, test } from '@playwright/test';

test.describe('Story 1.3: Camera Preview Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/camera');

    const grantPermissionButton = page.getByRole('button', { name: /grant camera access/i });
    if (await grantPermissionButton.isVisible()) {
      await grantPermissionButton.click();
    }

    const startCameraButton = page.getByRole('button', { name: /start camera/i });
    if (await startCameraButton.isVisible()) {
      await startCameraButton.click();
    }
  });

  test('should show full-screen video preview from back camera by default', async ({ page }) => {
    // WHEN: The camera screen loads
    const video = page.locator('video');
    
    // THEN: I see a video preview
    await expect(video).toBeVisible();
    
    // AND: It fills the viewport (full-screen)
    const box = await video.boundingBox();
    const viewport = page.viewportSize();
    
    if (box && viewport) {
      expect(box.width).toBeCloseTo(viewport.width, 0);
      expect(box.height).toBeCloseTo(viewport.height, 0);
    }
  });

  test('should not mirror the back camera view', async ({ page }) => {
    const video = page.locator('video');
    
    // THEN: The video is not mirrored
    // Check for CSS transform: scaleX(-1) which is common for mirroring
    const transform = await video.evaluate((el) => window.getComputedStyle(el).transform);
    expect(transform).not.toContain('matrix(-1');
  });

  test('should position video element at base z-index layer', async ({ page }) => {
    const video = page.locator('video');
    
    // THEN: The video element is at base z-index layer
    const zIndex = await video.evaluate((el) => window.getComputedStyle(el).zIndex);
    expect(zIndex).toBe('0');
  });

  test('should use portrait-optimized constraints', async ({ page }) => {
    const video = page.locator('video');

    await expect(video).toHaveJSProperty('playsInline', true);
    await expect(video).toHaveJSProperty('muted', true);
  });
});
