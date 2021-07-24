import { createRouter } from 'server/trpc';
import { algoliaRouter } from './algolia';
import { jobsRouter } from './jobs';

export const publicRouter = createRouter()
  .merge('algolia.', algoliaRouter)
  .merge('jobs.', jobsRouter);
