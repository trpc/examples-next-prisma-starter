import clsx from 'clsx';
import { Footer } from 'components/Footer';
import { Main } from 'components/Main';
import Head from 'next/head';
import { useEffect, useMemo } from 'react';
import { useQuery, useUtils } from '../utils/trpc';
import { useFilters } from 'hooks/useFilters';
import { HeroSection } from 'components/HeroSection';
import { JobListItem } from 'components/JobListItem';
import { JobListPagination } from 'components/JobListPagination';
import { NextSeo } from 'next-seo';

export default function IndexPage() {
  const { values } = useFilters();
  const input = useMemo(
    () => ({ query: values.q, cursor: values.page }),
    [values.page, values.q],
  );
  const jobsQuery = useQuery(['algolia.public.search', input], {
    keepPreviousData: true,
  });
  const utils = useUtils();

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
      <NextSeo
        title="TypeScript.careers"
        description="A niche job board - only for TypeScript jobs - aggregated from a bunch of places."
      />
      <HeroSection />
      <Main>
        <div
          className={clsx(
            `max-w-5xl mx-auto lg:my-4 overflow-hidden bg-white shadow lg:rounded-md`,
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
