import { useRouter } from 'next/dist/client/router';
import { useCallback, useEffect, useState } from 'react';
import { useDebouncedCallback } from './useDebouncedCallback';

export const useStringParam = (
  key: string,
  opts: {
    defaultValue?: '';
    debounceMs?: number;
  } = {},
) => {
  const { defaultValue = '', debounceMs = false } = opts;
  const router = useRouter();
  const queryValue =
    typeof router.query.q === 'string' ? router.query.q : defaultValue;

  const [value, setValue] = useState(() =>
    typeof router.query.q === 'string' ? router.query.q : defaultValue,
  );
  const setQueryValue = useCallback(
    (newValue: string) => {
      if (newValue === queryValue) {
        return;
      }
      const newQuery = {
        ...router.query,
        [key]: newValue,
      };
      if (newValue === defaultValue) {
        delete newQuery[key];

        router.push({
          query: {
            ...router.query,
            [key]: newValue,
          },
        });
      }
      router.push(
        {
          query: newQuery,
        },
        undefined,
        { scroll: false },
      );
    },
    [defaultValue, key, queryValue, router],
  );

  const debouncedFn = useDebouncedCallback(setQueryValue, debounceMs || 0);

  useEffect(() => {
    const fn = debounceMs ? debouncedFn : setValue;
    fn(value);
  }, [debounceMs, debouncedFn, value]);

  useEffect(() => {
    setValue(queryValue);
  }, [queryValue]);
  return [value, setValue] as const;
};
