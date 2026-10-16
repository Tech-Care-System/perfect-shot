import { expect, test, type Page } from '@playwright/test';

async function guideBounds(page: Page) {
  return page.getByTestId('wireframe-canvas').evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width;
    let top = canvas.height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] === 0) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    if (right < left || bottom < top) return null;
    const viewport = canvas.getBoundingClientRect();
    const header = document.querySelector('[data-testid="camera-header"]')!.getBoundingClientRect();
    const controls = document.querySelector('[data-testid="camera-controls"]')!.getBoundingClientRect();
    const hint = document.querySelector('[data-testid="pose-hint-card"]')!.getBoundingClientRect();
    const video = document.querySelector<HTMLVideoElement>('[data-testid="camera-video"]')!;
    const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    return {
      left, top, right, bottom, ratio: (right - left + 1) / (bottom - top + 1),
      headerBottom: header.bottom - viewport.top,
      controlsTop: controls.top - viewport.top,
      hintTop: hint.top - viewport.top,
      hintRight: hint.right - viewport.left,
      landscape: canvas.width > canvas.height && canvas.height <= 500,
      fit: getComputedStyle(video).objectFit,
      videoLeft: (canvas.width - video.videoWidth * scale) / 2,
      videoTop: (canvas.height - video.videoHeight * scale) / 2,
      videoRight: (canvas.width + video.videoWidth * scale) / 2,
      videoBottom: (canvas.height + video.videoHeight * scale) / 2,
    };
  });
}

async function expectUsableGuide(page: Page) {
  await expect.poll(() => page.getByTestId('wireframe-canvas').evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const bounds = canvas.getBoundingClientRect();
    return canvas.width === Math.round(bounds.width) && canvas.height === Math.round(bounds.height);
  })).toBe(true);
  await expect.poll(() => guideBounds(page)).not.toBeNull();
  const bounds = (await guideBounds(page))!;
  expect(bounds.ratio).toBeGreaterThan(0.25);
  expect(bounds.ratio).toBeLessThan(0.9);
  expect(bounds.top).toBeGreaterThanOrEqual(bounds.headerBottom + 10);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.controlsTop - 10);
  if (bounds.landscape) {
    expect(bounds.left).toBeGreaterThanOrEqual(bounds.hintRight + 10);
  } else {
    expect(bounds.bottom).toBeLessThanOrEqual(bounds.hintTop - 10);
  }
  if (bounds.fit === 'contain') {
    expect(bounds.left).toBeGreaterThanOrEqual(bounds.videoLeft - 1);
    expect(bounds.top).toBeGreaterThanOrEqual(bounds.videoTop - 1);
    expect(bounds.right).toBeLessThanOrEqual(bounds.videoRight + 1);
    expect(bounds.bottom).toBeLessThanOrEqual(bounds.videoBottom + 1);
  }
  return bounds;
}

for (const source of [{ width: 640, height: 360 }, { width: 720, height: 1280 }]) {
  test(`preserves the guide with a ${source.width}x${source.height} feed through fit, flip and rotation`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 393, height: 735 });
    await page.addInitScript(({ width, height }) => {
      const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = () => getUserMedia({
        video: { width: { exact: width }, height: { exact: height } },
      });
    }, source);
    await page.route('**/api/voice', (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ configured: false, plan: 'free', available: false }),
    }));
    await page.goto('/camera');
    await page.getByRole('button', { name: 'Grant Camera Access', exact: true }).click();
    await page.getByRole('button', { name: 'Start Camera', exact: true }).click();
    await expect.poll(() => page.getByTestId('camera-video').evaluate((element) => {
      const video = element as HTMLVideoElement;
      return video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
    })).toBe(true);
    await expect(page.getByTestId('camera-video')).toHaveJSProperty('videoWidth', source.width);
    await expect(page.getByTestId('camera-video')).toHaveJSProperty('videoHeight', source.height);
    const initial = await expectUsableGuide(page);
    await page.screenshot({ path: testInfo.outputPath('portrait-cover.png') });
    await page.getByRole('button', { name: 'Show Full Frame', exact: true }).click();
    await expect(page.getByTestId('camera-video')).toHaveCSS('object-fit', 'contain');
    const contained = await expectUsableGuide(page);
    expect(Math.abs(contained.ratio - initial.ratio)).toBeLessThan(0.04);
    await page.screenshot({ path: testInfo.outputPath('portrait-contain.png') });
    await page.getByRole('button', { name: 'Flip Camera', exact: true }).click();
    await expect(page.getByTestId('camera-video')).toHaveCSS('scale', '-1 1');
    await expectUsableGuide(page);
    await page.setViewportSize({ width: 852, height: 393 });
    await expectUsableGuide(page);
    await page.screenshot({ path: testInfo.outputPath('landscape-contain-front.png') });
    await page.getByRole('button', { name: 'Fill Screen', exact: true }).click();
    await expectUsableGuide(page);
    await page.screenshot({ path: testInfo.outputPath('landscape-cover-front.png') });
    await page.getByRole('button', { name: 'Capture Photo', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Photo Preview' })).toBeVisible();
    await page.getByRole('button', { name: 'Retake', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Capture Photo', exact: true })).toBeFocused();
    await expectUsableGuide(page);
  });
}
