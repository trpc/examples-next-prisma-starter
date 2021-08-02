import { useDebouncedCallback } from 'hooks/useDebouncedCallback';
import { useEffect, useState } from 'react';
import splitbee from '@splitbee/web';
import { useFilters } from 'hooks/useFilters';

export function SearchForm() {
  const params = useFilters();
  const [value, setValue] = useState(params.values.q);
  const debouncedChange = useDebouncedCallback((newValue: string) => {
    params.setParams({ q: newValue, page: 0 });
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
