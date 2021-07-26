import { useDebouncedCallback } from 'hooks/useDebouncedCallback';
import { useParams } from 'hooks/useParams';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { ReactQueryDevtools } from 'react-query/devtools';
import { inferQueryInput, trpc } from '../utils/trpc';

function useFilters() {
  return useParams({
    q: 'string',
    page: {
      type: 'number',
      default: 0,
    },
  });
}

function onFocusAndPress(fn: () => void) {
  return {
    onMouseEnter: fn,
    onFocus: fn,
  };
}

function SearchInput() {
  const params = useFilters();
  const [value, setValue] = useState(params.values.q);
  const debouncedChange = useDebouncedCallback((newValue: string) => {
    params.setParams({ q: newValue, page: 0 });
  }, 300);

  useEffect(() => {
    setValue(params.values.q);
  }, [params.values.q]);

  return (
    <input
      type="search"
      name="q"
      placeholder="Search..."
      onChange={(e) => {
        const newValue = e.target.value;
        setValue(newValue);
        debouncedChange(newValue);
      }}
      value={value}
    />
  );
}

export default function IndexPage() {
  const { values, getParams } = useFilters();
  type Input = inferQueryInput<'algolia.public.search'>;
  const input: Input = { query: values.q, cursor: values.page };
  const jobsQuery = trpc.useQuery(['algolia.public.search', input], {
    keepPreviousData: true,
  });
  const utils = trpc.useContext();
  const sources = trpc.useQuery(['public.sources']);

  return (
    <div style={{ padding: '40px' }}>
      <Head>
        <title>TypeScript.careers</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>TypeScript.careers</h1>
      <p>
        A niche job posting site - only for TypeScript jobs - currently sourcing
        from:{' '}
        {sources.data
          ?.map((source) => source.slug)
          .sort()
          .join(', ')}
        .
      </p>
      <blockquote>
        <p style={{ fontStyle: 'italic' }}>This site is a work in progress</p>
        <h4>A few cool features:</h4>
        <ul>
          <li>Zero loading times between pages / pagination</li>
          <li>Try disabling JavaScript. Page still works; even the filters.</li>
          <li>Search through Algolia</li>
          <li>
            Project is open-source on{' '}
            <a href="https://github.com/trpc/trpc">GitHub</a>.
          </li>
        </ul>
      </blockquote>
      <h2>Search for anything</h2>
      <form>
        <SearchInput />
        <noscript>
          <input type="submit" />
        </noscript>
      </form>
      <h2>
        Jobs
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
            <Link href={`/job/${item.$slug}`}>
              <a
                {...onFocusAndPress(() => {
                  utils.prefetchQuery(['job.public.bySlug', item.$slug]);
                })}
              >
                View job
              </a>
            </Link>
          </article>
        );
      })}

      <hr />
      <div>
        {values.page > 0 ? (
          <Link
            href={{
              query: getParams({ page: values.page - 1 }),
            }}
          >
            <a
              {...onFocusAndPress(() => {
                utils.prefetchQuery([
                  'algolia.public.search',
                  { ...input, cursor: values.page - 1 },
                ]);
              })}
            >
              Previous page
            </a>
          </Link>
        ) : null}{' '}
        {jobsQuery.data?.nbPages && jobsQuery.data.nbPages > values.page ? (
          <Link
            href={{
              query: getParams({ page: values.page + 1 }),
            }}
          >
            <a
              {...onFocusAndPress(() => {
                utils.prefetchQuery([
                  'algolia.public.search',
                  { ...input, cursor: values.page + 1 },
                ]);
              })}
            >
              Next page
            </a>
          </Link>
        ) : null}
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </div>
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
