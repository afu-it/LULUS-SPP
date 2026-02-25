import { expect, test } from '@playwright/test';

const pages = [
  { path: '/', heading: 'HOME' },
  { path: '/nota', heading: 'NOTA SPP' },
  { path: '/tips', heading: 'TIPS SPP' },
  { path: '/soalan', heading: 'SOALAN IV SPP' },
  { path: '/cara-daftar', heading: 'CARA DAFTAR SPP' },
  { path: '/settings', heading: 'Tetapan' },
];

for (const item of pages) {
  test(`page ${item.path} loads`, async ({ page }) => {
    await page.goto(item.path);
    await expect(page.getByRole('heading', { name: item.heading })).toBeVisible();

    // Bottom nav should always be visible on all pages
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  });
}

test('pwa assets are available', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);

  const icon = await request.get('/icons/icon-192.svg');
  expect(icon.status()).toBe(200);
});

test('health endpoint is healthy', async ({ request }) => {
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);

  const payload = (await health.json()) as { status?: string; database?: string };
  expect(payload.status).toBe('ok');
  expect(payload.database).toBe('ok');
});
