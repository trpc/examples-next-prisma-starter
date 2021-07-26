/**
 * This file contains the root router of your tRPC-backend
 */
import superjson from 'superjson';
import { createRouter } from '../trpc';
import { algoliaRouter } from './algolia';
import { cronRouter } from './cron';
import { jobRouter } from './job';
/**
 * Create your application's root router
 * If you want to use SSG, you need export this
 * @link https://trpc.io/docs/ssg
 * @link https://trpc.io/docs/router
 */
export const appRouter = createRouter()
  /**
   * Add data transformers
   * @link https://trpc.io/docs/data-transformers
   */
  .transformer(superjson)
  /**
   * Optionally do custom error (type safe!) formatting
   * @link https://trpc.io/docs/error-formatting
   */
  // .formatError(({ shape, error }) => { })
  .query('public.sources', {
    resolve({ ctx }) {
      return ctx.prisma.source.findMany();
    },
  })
  .merge('cron.', cronRouter)
  .merge('algolia.', algoliaRouter)
  .merge('job.', jobRouter);

export type AppRouter = typeof appRouter;
