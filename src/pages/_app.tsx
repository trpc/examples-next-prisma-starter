import splitbee from '@splitbee/web';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import { loggerLink } from '@trpc/client/links/loggerLink';
import { withTRPC } from '@trpc/next';
import { DefaultSeo } from 'next-seo';
import { AppType } from 'next/dist/shared/lib/utils';
import { useEffect } from 'react';
import { AppRouter } from 'server/routers/app';
import 'styles/global.css';
import superjson from 'superjson';
import 'tailwindcss/tailwind.css';
import { getBaseUrl } from 'utils/trpc';

const MyApp: AppType = ({ Component, pageProps }) => {
  useEffect(() => {
    splitbee.init({
      scriptUrl: '/bee.js',
      apiUrl: '/_hive',
    });
  }, []);

  return (
    <>
      <DefaultSeo
        openGraph={{
          type: 'website',
          locale: 'en_US',
          url: 'https://typescript.careers/',
          site_name: 'Typescript Careers',
        }}
        twitter={{
          handle: '@alexdotjs',
          cardType: 'summary_large_image',
        }}
      />
      <div className="flex flex-col justify-between min-h-screen">
        <Component {...pageProps} />
      </div>
    </>
  );
};

export default withTRPC<AppRouter>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config({ ctx }) {
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
  responseMeta({ clientErrors, ctx }) {
    // errors
    if (clientErrors.length) {
      // propagate http first error from API calls
      const status = clientErrors[0].data?.httpStatus ?? 500;
      console.warn('❌ render errors', { status, clientErrors });
      return {
        status,
      };
    }
    // caching
    const parts = new URL(`http://localhost` + ctx.req?.url);
    if (parts.pathname === '/' || parts.pathname.startsWith('/job/')) {
      console.log('🏎 Caching:', parts.pathname);
      // cache full page for 1 day + revalidate once every second
      const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
      return {
        headers: {
          'Cache-Control': `s-maxage=1, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`,
        },
      };
    }

    return {};
  },
})(MyApp);
