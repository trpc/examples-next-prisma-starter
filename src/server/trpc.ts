import { PrismaClient } from '@prisma/client';
import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';

export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});
/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async ({
  req,
  res,
}: trpcNext.CreateNextContextOptions) => {
  // get the tRPC-paths called in this request
  const paths = (req.query.trpc as string).split(',');
  // assuming you have a router prefixed with `public.` where you colocate publicly accessible routes
  const isPublic = paths.some((path) => !/\bpublic\b/.test(path));

  // check if it's a query & public
  if (req.method === 'GET' && isPublic) {
    // cache request for 1 day + revalidate once every second
    const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
    res.setHeader(
      'Cache-Control',
      `s-maxage=1, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`,
    );
  }

  return {
    req,
    res,
    prisma,
  };
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;

/**
 * Helper function to create a router with context
 */
export function createRouter() {
  return trpc.router<Context>();
}
