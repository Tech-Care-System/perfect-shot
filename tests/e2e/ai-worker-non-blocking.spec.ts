import { expect, test } from '@playwright/test';

test.describe('Story 2.1: AI Worker non-blocking behavior', () => {
  test('keeps UI responsive while worker processes DETECT messages', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/test-ai-worker');

    await expect(page.getByTestId('worker-status')).toHaveText('ready');

    const detectButton = page.getByRole('button', { name: 'Run DETECT' });
    const counterButton = page.getByTestId('ui-counter-button');
    const counterValue = page.getByTestId('ui-counter-value');

    await detectButton.click();
    await detectButton.click();
    await detectButton.click();

    for (let i = 0; i < 10; i += 1) {
      await counterButton.click();
    }

    await expect(counterValue).toHaveText('10');
    expect(pageErrors).toEqual([]);
    // The first software-GPU inference is cold and measured at 8–10 seconds locally.
    await expect(page.getByTestId('worker-response')).toHaveText('POSE_RESULT', { timeout: 15_000 });
    await expect(page.getByTestId('worker-error')).toHaveText('none');
  });
});
