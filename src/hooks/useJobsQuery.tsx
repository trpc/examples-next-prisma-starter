import { useMemo } from 'react';
import { useQuery } from '../utils/trpc';
import { useFilters } from 'hooks/useFilters';

export function useJobsQuery() {
  const filters = useFilters();
  const values = filters.values;
  const input = useMemo(
    () => ({ query: values.q, cursor: values.page }),
    [values.page, values.q],
  );
  const jobsQuery = useQuery(['algolia.public.search', input], {
    keepPreviousData: true,
  });
  const hasPrevPage = values.page > 0;
  const hasNextPage = !!(
    jobsQuery.data?.nbPages && values.page < jobsQuery.data.nbPages - 1
  );
  return { jobsQuery, hasPrevPage, hasNextPage, filters };
}
