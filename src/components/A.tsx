import splitbee from '@splitbee/web';
import { HTMLProps } from 'react';

export function A(props: HTMLProps<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        splitbee.track('click-link', {
          href: props.href ?? '?',
        });
      }}
    />
  );
}
