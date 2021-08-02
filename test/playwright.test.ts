jest.setTimeout(35e3);

beforeAll(async () => {
  const res = await page.goto('http://localhost:3000/api/trpc/algolia.reindex');
  expect(res?.ok()).toBeTruthy();
});

test('go to /', async () => {
  await page.goto('http://localhost:3000');

  await page.waitForSelector(`text=Seed TypeScript Job`);
  await page.waitForSelector(`text=Nowhere`);
});

export {};
