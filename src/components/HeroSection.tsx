import { Fragment } from 'react';
import { useQuery } from '../utils/trpc';
import { A } from 'components/A';
import { SearchForm } from 'components/SearchForm';

export function HeroSection() {
  const sources = useQuery(['public.sources']);
  return (
    <div className="py-10 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl ">
        <span className="block text-gray-900 xl:inline">
          Find a job writing{' '}
        </span>{' '}
        <span className="block font-bold text-transparent xl:inline bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
          TypeScript
        </span>
      </h1>
      <p className="max-w-md mx-auto mt-3 text-base text-gray-800 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
        A niche job board - only for TypeScript jobs - aggregated from a bunch
        of places.
        <br />
        <span className="text-base italic text-gray-600">
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
