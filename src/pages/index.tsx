import {
  AdjustmentsIcon,
  CalendarIcon,
  LocationMarkerIcon,
  OfficeBuildingIcon,
} from '@heroicons/react/solid';
import splitbee from '@splitbee/web';
import clsx from 'clsx';
import { A } from 'components/A';
import { Footer } from 'components/Footer';
import { Main } from 'components/Main';
import { useDebouncedCallback } from 'hooks/useDebouncedCallback';
import { useParams } from 'hooks/useParams';
import { NextSeo } from 'next-seo';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useIsDev } from '../hooks/useIsDev';
import { inferQueryOutput, useQuery, useUtils } from '../utils/trpc';

function useFilters() {
  return useParams({
    q: 'string',
    page: {
      type: 'number',
      default: 1,
    },
  });
}
function useJobsQuery() {
  const filters = useFilters();
  const values = filters.values;
  const input = useMemo(
    () => ({ query: values.q, cursor: values.page - 1 }),
    [values.page, values.q],
  );
  const jobsQuery = useQuery(['algolia.public.search', input], {
    keepPreviousData: true,
  });
  const hasPrevPage = values.page > 1;
  const hasNextPage = !!(
    jobsQuery.data?.nbPages && values.page < jobsQuery.data.nbPages
  );
  return { jobsQuery, hasPrevPage, hasNextPage, filters };
}

function SearchForm() {
  const params = useFilters();
  const [value, setValue] = useState(params.values.q);
  const debouncedChange = useDebouncedCallback((newValue: string) => {
    params.setParams({ q: newValue, page: 1 });
  }, 300);

  useEffect(() => {
    setValue(params.values.q);
  }, [params.values.q]);

  // track searches
  useEffect(() => {
    splitbee.track('search', params.values);
  }, [params.values]);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="block w-full">
      <input
        type="search"
        id="search"
        className="block w-full text-center border-gray-300 rounded-md shadow-sm focus:ring-primary-600 focus:border-primary-500 sm:text-lg"
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
  const sources = useQuery(['public.sources']);
  return (
    <div className="py-10 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
        <span className="block xl:inline">Find a job writing </span>{' '}
        <span className="block text-primary-500 xl:inline">TypeScript</span>
      </h1>
      <p className="max-w-md mx-auto mt-3 text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
        A niche job board - only for TypeScript jobs - aggregated from a bunch
        of places.
        <br />
        <span className="italic opacity-40">
          (currently sourcing from{' '}
          {sources.data?.map((source, index) => (
            <Fragment key={source.slug}>
              <A
                href={source.url}
                className="hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {source.name}
              </A>
              {index < sources.data.length - 1 ? ', ' : ''}
            </Fragment>
          ))}
          )
        </span>
      </p>
      <div className="max-w-md mx-auto mt-5 sm:flex sm:justify-center md:mt-8">
        <SearchForm />
      </div>
    </div>
  );
}

function TagList(props: { items: string[]; limit?: number }) {
  const { limit: tagLimit = 6, items } = props;
  const hidden = items.slice(tagLimit);

  return (
    <div className="flex-wrap justify-end hidden ml-2 text-right md:flex">
      {props.items.map((tag, index) => (
        <span
          key={index}
          className={clsx(
            'px-2 mb-1 ml-1 text-xs font-semibold leading-5 text-gray-800 rounded-full bg-primary-100',
            index > tagLimit - 1 ? 'hidden' : 'inline-flex',
          )}
        >
          <ReactMarkdown allowedElements={['em']} unwrapDisallowed>
            {tag}
          </ReactMarkdown>
        </span>
      ))}
      {props.items.length > tagLimit && (
        <span
          className="inline-flex px-2 mb-1 ml-1 text-xs font-semibold leading-5 text-gray-800 rounded-full bg-primary-100"
          title={hidden.join(', ')}
        >
          +{props.items.length - tagLimit}
        </span>
      )}
    </div>
  );
}

function JobListItem(props: {
  item: inferQueryOutput<'algolia.public.search'>['hits'][number];
}) {
  const { item } = props;
  const isDev = useIsDev();
  return (
    <article key={item.id} className="JobListItem">
      <Link href={`/job/${item.$slug}`}>
        <a className="block hover:bg-gray-50">
          <div className="px-4 py-4 sm:px-6">
            <div className="items-center sm:flex">
              {isDev && item.companyLogoUrl && (
                <div className="relative flex-shrink-0 w-10 h-10 mb-2 sm:mr-2 sm:mb-0">
                  <Image
                    alt={item.companyName}
                    src={item.companyLogoUrl}
                    className="mr-2"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              )}
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="flex-shrink-0 text-sm font-medium text-primary-400">
                    <ReactMarkdown allowedElements={['em']} unwrapDisallowed>
                      {item.title}
                    </ReactMarkdown>
                  </h3>
                  <div className="flex-wrap justify-end hidden ml-2 text-right md:flex">
                    <TagList items={item.tags} />
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
                      <ReactMarkdown allowedElements={['em']} unwrapDisallowed>
                        {item.companyName}
                      </ReactMarkdown>
                    </p>
                    {isDev && (
                      <p className="flex items-center mt-2 text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <AdjustmentsIcon
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                        {item.__score}
                      </p>
                    )}
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
            </div>
          </div>
        </a>
      </Link>
    </article>
  );
}

function JobListPagination() {
  const { jobsQuery, filters, hasPrevPage, hasNextPage } = useJobsQuery();
  const { values, getParams } = filters;
  const data = jobsQuery.data;
  return (
    <nav
      className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6"
      aria-label="Pagination"
    >
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          Page <span className="font-medium">{values.page}</span> of{' '}
          <span className="font-medium">{data?.nbPages}</span> from{' '}
          <span className="font-medium">{data?.nbHits}</span> total hits
        </p>
      </div>
      <div className="flex justify-between flex-1 space-x-2 sm:justify-end">
        <Link
          href={{
            query: filters.getParams({ page: values.page - 1 }),
            hash: 'main',
            pathname: '/',
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
            hash: 'main',
            pathname: '/',
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
  );
}

export default function IndexPage() {
  const { values } = useFilters();
  const input = useMemo(
    () => ({ query: values.q, cursor: values.page - 1 }),
    [values.page, values.q],
  );
  const jobsQuery = useQuery(['algolia.public.search', input], {
    keepPreviousData: true,
  });
  const utils = useUtils();

  const hasPrevPage = values.page > 1;
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
      <NextSeo
        title="TypeScript.careers"
        description="A niche job board - only for TypeScript jobs - aggregated from a bunch of places."
      />
      <HeroSection />
      <Main>
        <div
          className={clsx(
            `max-w-5xl mx-auto my-4 overflow-hidden bg-white shadow sm:rounded-md`,
            jobsQuery.isFetching && 'animate-pulse',
          )}
        >
          {data?.hits.length === 0 && (
            <div className="p-4 text-center text-gray-600">
              No hits on your search 😿
            </div>
          )}
          {data?.hits && data.hits.length > 0 && (
            <>
              <ul className="divide-y divide-gray-200">
                {data?.hits.map((item) => (
                  <JobListItem key={item.id} item={item} />
                ))}
              </ul>
              <JobListPagination />
            </>
          )}
        </div>
      </Main>
      <Footer />
    </>
  );
}
