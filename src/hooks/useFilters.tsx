import { useParams } from 'hooks/useParams';

export function useFilters() {
  return useParams({
    q: 'string',
    page: {
      type: 'number',
      default: 0,
    },
  });
}
