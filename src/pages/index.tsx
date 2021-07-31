import { useDebouncedCallback } from 'hooks/useDebouncedCallback';
import { useParams } from 'hooks/useParams';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { inferQueryOutput, trpc } from '../utils/trpc';
import {
  CalendarIcon,
  LocationMarkerIcon,
  UsersIcon,
  OfficeBuildingIcon,
  AdjustmentsIcon,
} from '@heroicons/react/solid';
import { Footer } from 'components/Footer';
import clsx from 'clsx';
function useFilters() {
  return useParams({
    q: 'string',
    page: {
      type: 'number',
      default: 0,
    },
  });
}

function SearchForm() {
  const params = useFilters();
  const [value, setValue] = useState(params.values.q);
  const debouncedChange = useDebouncedCallback((newValue: string) => {
    params.setParams({ q: newValue, page: 0 });
  }, 300);

  useEffect(() => {
    setValue(params.values.q);
  }, [params.values.q]);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <input
        type="search"
        id="search"
        autoFocus
        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-600 focus:border-primary-500 sm:text-lg"
        name="q"
        placeholder="Search for anything..."
        onChange={(e) => {
          const newValue = e.target.value;
          setValue(newValue);
          debouncedChange(newValue);
        }}
        value={value}
      />
      <noscript>
        <input type="submit" />
      </noscript>
    </form>
  );
}
function HeroSection() {
  const sources = trpc.useQuery(['public.sources']);
  return (
    <div className="py-10 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
        <span className="block xl:inline">Find your next</span>{' '}
        <span className="block text-primary-500 xl:inline">TypeScript</span>{' '}
        opportunity
      </h1>
      <p className="max-w-md mx-auto mt-3 text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
        A niche job posting site - only for TypeScript jobs - currently sourcing
        from:{' '}
        {sources.data
          ?.map((source) => source.slug)
          .sort()
          .join(', ')}
        .
      </p>
      <div className="max-w-md mx-auto mt-5 sm:flex sm:justify-center md:mt-8">
        <SearchForm />
      </div>
    </div>
  );
}

function JobListItem(props: {
  item: inferQueryOutput<'algolia.public.search'>['hits'][number];
}) {
  const { item } = props;
  return (
    <article key={item.id}>
      <Link href={`/job/${item.$slug}`}>
        <a className="block hover:bg-gray-50">
          <div className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="flex-shrink-0 text-sm font-medium text-primary-600">
                <ReactMarkdown allowedElements={['em']} unwrapDisallowed>
                  {item.title}
                </ReactMarkdown>
              </h3>
              <div className="flex-wrap justify-end hidden ml-2 text-right md:flex">
                {item.tags.length > 0 && (
                  <>
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 mb-1 ml-1 text-xs font-semibold leading-5 text-gray-800 rounded-full bg-primary-100"
                      >
                        <ReactMarkdown
                          allowedElements={['em']}
                          unwrapDisallowed
                        >
                          {tag}
                        </ReactMarkdown>
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>
            <div className="mt-2 sm:flex sm:justify-between">
              <div className="sm:flex">
                <p className="flex items-center text-sm text-gray-500">
                  <LocationMarkerIcon
                    className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <ReactMarkdown allowedElements={['em']} unwrapDisallowed>
                    {item.location ?? 'Unknown'}
                  </ReactMarkdown>
                </p>
                <p className="flex items-center mt-2 text-sm text-gray-500 sm:mt-0 sm:ml-6">
                  <OfficeBuildingIcon
                    className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  {item.company.name}
                </p>
                <p className="flex items-center mt-2 text-sm text-gray-500 sm:mt-0 sm:ml-6">
                  <AdjustmentsIcon
                    className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  {item.__score}
                </p>
              </div>
              <div className="flex items-center mt-2 text-sm text-gray-500 sm:mt-0">
                <CalendarIcon
                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                <p>
                  Published on{' '}
                  <time dateTime={item.publishDate.toJSON()}>
                    {item.publishDate.toDateString()}
                  </time>
                </p>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </article>
  );
}

export default function IndexPage() {
  const { values, getParams } = useFilters();
  const input = useMemo(
    () => ({ query: values.q, cursor: values.page }),
    [values.page, values.q],
  );
  const jobsQuery = trpc.useQuery(['algolia.public.search', input], {
    keepPreviousData: true,
  });
  const utils = trpc.useContext();

  const hasPrevPage = values.page > 0;
  const hasNextPage = !!(
    jobsQuery.data?.nbPages && jobsQuery.data.nbPages > values.page
  );
  // prefetch next/prev page
  useEffect(() => {
    hasPrevPage &&
      utils.prefetchQuery([
        'algolia.public.search',
        { ...input, cursor: input.cursor - 1 },
      ]);
    hasNextPage &&
      utils.prefetchQuery([
        'algolia.public.search',
        { ...input, cursor: input.cursor + 1 },
      ]);
  }, [hasNextPage, hasPrevPage, input, utils]);

  // prefetch all items
  useEffect(() => {
    jobsQuery.data?.hits.forEach((hit) =>
      utils.prefetchQuery(['job.public.bySlug', hit.$slug]),
    );
  }, [jobsQuery.data?.hits, utils]);

  const data = jobsQuery.data;
  return (
    <>
      <Head>
        <title>TypeScript.careers</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="p-2 pb-10 bg-primary-100">
        <HeroSection />
        <div className="max-w-5xl mx-auto overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {data?.hits.map((item) => (
              <JobListItem key={item.id} item={item} />
            ))}
          </ul>

          <nav
            className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6"
            aria-label="Pagination"
          >
            <div className="hidden sm:block">
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{values.page + 1}</span> of{' '}
                <span className="font-medium">{data?.nbPages}</span> from{' '}
                <span className="font-medium">{data?.nbHits}</span> total hits
              </p>
            </div>
            <div className="flex justify-between flex-1 space-x-2 sm:justify-end">
              <Link
                href={{
                  query: getParams({ page: values.page - 1 }),
                }}
              >
                <a
                  className={clsx(
                    `relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50`,
                    !hasPrevPage &&
                      'pointer-events-none cursor-not-allowed opacity-20',
                  )}
                >
                  Previous
                </a>
              </Link>

              <Link
                href={{
                  query: getParams({ page: values.page + 1 }),
                }}
              >
                <a
                  className={clsx(
                    `relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50`,
                    !hasNextPage &&
                      'pointer-events-none cursor-not-allowed opacity-20',
                  )}
                >
                  Next
                </a>
              </Link>
            </div>
          </nav>
        </div>
      </div>

      <Footer />
    </>
  );
}
