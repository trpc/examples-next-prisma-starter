import AbortController from 'abort-controller';
import fetch from 'node-fetch';

export async function fetchJSON(opts: { url: string }) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 3_000);

  const res = await fetch(opts.url, {
    headers: {
      'user-agent': 'typescript.careers',
      // 'x-greetings-from': 'alex@kattcorp.com / https://typescript.careers',
    },
    method: 'GET',
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    console.log('text', await res.text());
    throw new Error('fetchJSON failed');
  }

  const json = await res.json();

  return json as unknown;
}
