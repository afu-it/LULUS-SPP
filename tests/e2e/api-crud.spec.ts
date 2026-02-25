import { expect, test } from '@playwright/test';

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'LulusSPP2026!';

test('core API CRUD smoke works', async ({ request }) => {
  const stamp = Date.now();
  const authorToken = `e2e-author-${stamp}`;

  const login = await request.post('/api/auth', {
    data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
  });
  expect(login.status()).toBe(200);

  const announcement = await request.post('/api/announcements', {
    data: { content: `E2E announcement ${stamp}`, isActive: true },
  });
  expect(announcement.status()).toBe(201);

  const postCreate = await request.post('/api/posts', {
    data: {
      content: `E2E post ${stamp}`,
      authorName: 'E2E Tester',
      authorToken,
    },
  });
  expect(postCreate.status()).toBe(201);
  const postCreateJson = (await postCreate.json()) as { item: { id: string } };
  const postId = postCreateJson.item.id;

  const commentCreate = await request.post(`/api/posts/${postId}/comments`, {
    data: {
      content: `E2E comment ${stamp}`,
      authorName: 'E2E Tester',
      authorToken,
    },
  });
  expect(commentCreate.status()).toBe(201);

  const noteCreate = await request.post('/api/notes', {
    data: {
      title: `E2E note ${stamp}`,
      content: 'Note content from e2e',
      link: 'https://example.com/e2e',
      authorName: 'E2E Tester',
      authorToken,
    },
  });
  expect(noteCreate.status()).toBe(201);

  const tipCreate = await request.post('/api/tips', {
    data: {
      content: `E2E tip ${stamp}`,
      authorName: 'E2E Tester',
      authorToken,
      newLabels: [`E2E label ${stamp}`],
    },
  });
  expect(tipCreate.status()).toBe(201);

  const bidangList = await request.get('/api/bidang');
  expect(bidangList.status()).toBe(200);
  const bidangJson = (await bidangList.json()) as { items: Array<{ id: string }> };
  expect(bidangJson.items.length).toBeGreaterThan(0);

  const soalanCreate = await request.post('/api/soalan', {
    data: {
      content: `E2E soalan ${stamp}`,
      bidangId: bidangJson.items[0].id,
      authorName: 'E2E Tester',
      authorToken,
    },
  });
  expect(soalanCreate.status()).toBe(201);

  const caraCreate = await request.post('/api/cara-daftar', {
    data: {
      stepNo: 700 + (stamp % 100),
      title: `E2E step ${stamp}`,
      content: 'E2E step content',
      linkUrl: 'https://example.com/e2e-step',
    },
  });
  expect(caraCreate.status()).toBe(201);

  expect((await request.get('/api/posts')).status()).toBe(200);
  expect((await request.get('/api/notes')).status()).toBe(200);
  expect((await request.get('/api/tips')).status()).toBe(200);
  expect((await request.get('/api/soalan')).status()).toBe(200);
  expect((await request.get('/api/cara-daftar')).status()).toBe(200);
});
