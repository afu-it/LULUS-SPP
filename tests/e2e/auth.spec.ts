import { expect, test } from '@playwright/test';

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'LulusSPP2026!';

test('auth login and logout flow works', async ({ request }) => {
  const protectedWithoutAuth = await request.post('/api/announcements', {
    data: { content: 'should fail', isActive: true },
  });
  expect(protectedWithoutAuth.status()).toBe(403);

  const before = await request.get('/api/auth');
  expect(before.status()).toBe(401);

  const login = await request.post('/api/auth', {
    data: {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    },
  });

  expect(login.status()).toBe(200);

  const loginJson = (await login.json()) as { authenticated?: boolean; username?: string };
  expect(loginJson.authenticated).toBe(true);
  expect(loginJson.username).toBe(ADMIN_USERNAME);

  const afterLogin = await request.get('/api/auth');
  expect(afterLogin.status()).toBe(200);

  const afterLoginJson = (await afterLogin.json()) as { authenticated?: boolean; username?: string };
  expect(afterLoginJson.authenticated).toBe(true);
  expect(afterLoginJson.username).toBe(ADMIN_USERNAME);

  const logout = await request.delete('/api/auth');
  expect(logout.status()).toBe(200);

  const afterLogout = await request.get('/api/auth');
  expect(afterLogout.status()).toBe(401);
});

test('auth rate limiter blocks repeated failed attempts', async ({ request }) => {
  const rateTargetUsername = `ratelimit-${Date.now()}`;

  for (let i = 0; i < 6; i += 1) {
    await request.post('/api/auth', {
      data: {
        username: rateTargetUsername,
        password: `wrong-password-${i}`,
      },
    });
  }

  const blocked = await request.post('/api/auth', {
    data: {
      username: rateTargetUsername,
      password: 'definitely-wrong-password',
    },
  });

  expect(blocked.status()).toBe(429);
});
