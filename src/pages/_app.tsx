import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import { loggerLink } from '@trpc/client/links/loggerLink';
import { withTRPC } from '@trpc/next';
import { AppType } from 'next/dist/next-server/lib/utils';
import { AppRouter } from 'server/routers/app';
import superjson from 'superjson';
import splitbee from '@splitbee/web';
import 'tailwindcss/tailwind.css';
import 'styles/global.css';
import { useEffect } from 'react';

const MyApp: AppType = ({ Component, pageProps }) => {
  useEffect(() => {
    splitbee.init({
      scriptUrl: '/bee.js',
      apiUrl: '/_hive',
    });
  }, []);

  return (
    <>
      <div className="flex flex-col justify-between min-h-screen">
        <Component {...pageProps} />
      </div>
    </>
  );
};

function getBaseUrl() {
  if (process.browser) {
    return '';
  }
  // // reference for vercel.com
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // // reference for render.com
  // if (process.env.RENDER_INTERNAL_HOSTNAME) {
  //   return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  // }

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export default withTRPC<AppRouter>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config({ ctx }) {
    // for app caching with SSR see https://trpc.io/docs/caching

    if (ctx?.req?.url && !process.browser) {
      const parts = new URL(`http://localhost` + ctx.req.url);

      if (parts.pathname === '/' || parts.pathname.startsWith('/job/')) {
        console.log('🏎 Caching:', parts.pathname);
        // cache full page for 1 day + revalidate once every second
        const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
        ctx.res?.setHeader(
          'Cache-Control',
          `s-maxage=1, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`,
        );
      }
    }
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    return {
      /**
       * @link https://trpc.io/docs/links
       */
      links: [
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
      /**
       * @link https://trpc.io/docs/data-transformers
       */
      transformer: superjson,
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min
          },
        },
      },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: true,
})(MyApp);
