import clsx from 'clsx';
import Link from 'next/link';
import { useJobsQuery } from 'hooks/useJobsQuery';

export function JobListPagination() {
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
          Page <span className="font-medium">{values.page + 1}</span> of{' '}
          <span className="font-medium">{data?.nbPages}</span> from{' '}
          <span className="font-medium">{data?.nbHits}</span> total hits
        </p>
      </div>
      <div className="flex justify-between flex-1 space-x-2 sm:justify-end">
        <Link
          href={{
            query: filters.getParams({ page: values.page - 1 }),
            hash: 'main',
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
