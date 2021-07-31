import { inferAsyncReturnType } from '@trpc/server';
import algoliasearch from 'algoliasearch';
import _ from 'lodash';
import { env } from 'server/env';
import { prisma } from 'server/trpc';
import { getAppState, setAppState } from './appState';

const client = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_ADMIN_KEY);
export const algoliaIndex = client.initIndex('jobs');

async function getAlgoliaEntries(since: Date | null) {
  const items = await prisma.job.findMany({
    where: since
      ? {
          updatedAt: { gte: since },
        }
      : {},
    include: {
      company: true,
    },
  });

  const words: [string, number][] = [
    ['typescript', 10],
    ['node.js', 2],
    ['nodejs', 2],
    ['deno', 3],
    ['react', 1],
    ['svelte', 1],
    ['vue', 1],
    ['rails', -1],
    ['ruby', -1],
    ['laravel', -1],
  ];
  const list = words.map(([str, weight]) => ({
    str,
    weight,
    regex: new RegExp(str, 'ig'),
  }));
  function getScore(job: typeof items[number]) {
    const numMatches = (str: string) =>
      list.reduce((sum, { regex, weight }) => {
        return sum + (str.match(regex)?.length ?? 0) * weight;
      }, 0);
    const score =
      numMatches(job.title) * 100 +
      numMatches(job.tags.join('')) * 10 +
      numMatches(job.text) * 1;

    return score;
  }

  return items.map((job) => ({
    objectID: job.id,
    ...job,
    companyName: job.company.name,
    createdAtTimestamp: job.createdAt.getTime() / 1000,
    updatedAtTimestamp: job.createdAt.getTime() / 1000,
    deletedAtTimestamp: job.deletedAt ? job.deletedAt.getTime() / 100 : null,
    __score: getScore(job),
    __tags: [job.deletedAt ? 'deleted' : 'not-deleted'],
  }));
}

export type AlgoliaJob = inferAsyncReturnType<typeof getAlgoliaEntries>[number];

async function updateSettings() {
  await algoliaIndex.setSettings({
    searchableAttributes: [
      'title',
      'tags',
      'sourceSlug',
      'companyName',
      'text',
      'location',
    ],
    customRanking: [
      //
      'desc(__score)',
    ],
    attributesForFaceting: [
      //
      '__tags',
      'location',
    ],
  });
}

export async function alogliaReindex(opts: { flush?: boolean } = {}) {
  const now = new Date();
  const { lastReindex } = await getAppState();
  const since = opts.flush ? null : lastReindex;
  const items = await getAlgoliaEntries(since);

  since
    ? await algoliaIndex.saveObjects(items)
    : await algoliaIndex.replaceAllObjects(items);

  await setAppState({ lastReindex: now });
  await updateSettings();

  return {
    count: items.length,
    appId: env.ALGOLIA_APP_ID,
    jobs: _(items)
      .map((item) => ({
        id: item.id,
        title: item.title,
        __score: item.__score,
        __tags: item.__tags,
      }))
      .sortBy('__score')
      .reverse()
      .value(),
  };
}
