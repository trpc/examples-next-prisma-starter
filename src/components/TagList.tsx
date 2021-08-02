import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

interface Props {
  tags: string[];
}

const TAG_LIMIT = 6;

export const TagList = ({ tags }: Props) => {
  return (
    <div className="flex-wrap justify-end hidden ml-2 text-right md:flex">
      {tags.length > 0 && (
        <>
          {tags.map((tag, index) => (
            <span
              key={index}
              className={clsx(
                'px-2 mb-1 ml-1 text-xs font-semibold leading-5 text-gray-800 rounded-full bg-primary-100',
                index > TAG_LIMIT ? 'hidden' : 'inline-flex',
              )}
            >
              <ReactMarkdown allowedElements={['em']} unwrapDisallowed>
                {tag}
              </ReactMarkdown>
            </span>
          ))}
        </>
      )}
      {tags.length > TAG_LIMIT && (
        <span className="inline-flex px-2 mb-1 ml-1 text-xs font-semibold leading-5 text-gray-800 rounded-full bg-primary-100">
          +{tags.length - TAG_LIMIT}
        </span>
      )}
    </div>
  );
};
