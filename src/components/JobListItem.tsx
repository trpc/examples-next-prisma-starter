import {
  AdjustmentsIcon,
  CalendarIcon,
  LocationMarkerIcon,
  OfficeBuildingIcon,
} from '@heroicons/react/solid';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useIsDev } from '../hooks/useIsDev';
import { inferQueryOutput } from '../utils/trpc';
import Image from 'next/image';

export function JobListItem(props: {
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
                  <h3 className="flex-shrink-0 text-xl font-medium text-primary-400">
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
