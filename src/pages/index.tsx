import Head from 'next/head';
import Link from 'next/link';
import Markdown from 'react-markdown';
import { ReactQueryDevtools } from 'react-query/devtools';
import { useStringParam } from '../hooks/useStringParam';
import { trpc } from '../utils/trpc';

function SearchInput() {
  const [value, setValue] = useStringParam('q', { debounceMs: 300 });

  return (
    <input
      type="search"
      name="query"
      placeholder="Search..."
      onChange={(e) => setValue(e.target.value)}
      value={value}
    />
  );
}

export default function IndexPage() {
  const [query] = useStringParam('q');
  const utils = trpc.useContext();
  const jobsQuery = trpc.useQuery(['public.algolia.basic', { query }], {
    keepPreviousData: true,
  });

  return (
    <>
      <Head>
        <title>Prisma Starter</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Welcome to your tRPC starter!</h1>
      <form>
        <SearchInput />
        <noscript>
          <input type="submit" />
        </noscript>
      </form>
      <h2>
        Posts
        {jobsQuery.status === 'loading' && '(loading)'}
      </h2>
      {jobsQuery.data?.hits.map((item) => {
        return (
          <article key={item.id}>
            <h3>
              <Markdown allowedElements={['em']} unwrapDisallowed>
                {item.title}
              </Markdown>
            </h3>
            {item.tags.length > 0 && (
              <p>
                tags:{' '}
                {item.tags.map((tag, index) => (
                  <span key={index}>
                    <Markdown allowedElements={['em']} unwrapDisallowed>
                      {tag}
                    </Markdown>
                    {index < item.tags.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            )}
            <p></p>
            <details>
              <pre>{JSON.stringify(item, null, 4)}</pre>
            </details>
            <Link href={`/jobs/${item.$slug}`}>
              <a
                onFocus={() =>
                  utils.prefetchQuery(['public.jobs.bySlug', item.$slug])
                }
                onMouseEnter={() => {
                  utils.prefetchQuery(['public.jobs.bySlug', item.$slug]);
                }}
              >
                View job
              </a>
            </Link>
          </article>
        );
      })}

      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
}

/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @link https://trpc.io/docs/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createSSGHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });
//
//   await ssg.fetchQuery('posts.all');
//
//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };
