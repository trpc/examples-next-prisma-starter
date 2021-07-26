import { inferAsyncReturnType } from '@trpc/server';
import algoliasearch from 'algoliasearch';
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
  });

  return items.map((job) => ({
    objectID: job.id,
    ...job,
    createdAtTimestamp: job.createdAt.getTime() / 1000,
    updatedAtTimestamp: job.createdAt.getTime() / 1000,
    deletedAtTimestamp: job.deletedAt ? job.deletedAt.getTime() / 100 : null,
  }));
}

export type AlgoliaJob = inferAsyncReturnType<typeof getAlgoliaEntries>[number];

async function updateSettings() {
  await algoliaIndex.setSettings({
    searchableAttributes: ['title', 'tags', 'sourceSlug', 'text'],
    ranking: [
      'proximity',
      'desc(publishDate)',
      'desc(updatedAtTimestamp)',
      'desc(createdAtTimestamp)',
    ],
    attributesForFaceting: ['deletedAt'],
  });
}

export async function alogliaReindex() {
  const now = new Date();
  const { lastReindex } = await getAppState();
  const items = await getAlgoliaEntries(lastReindex);

  lastReindex
    ? await algoliaIndex.saveObjects(items)
    : await algoliaIndex.replaceAllObjects(items);

  await setAppState({ lastReindex: now });
  await updateSettings();

  return {
    count: items.length,
    appId: env.ALGOLIA_APP_ID,
  };
}
