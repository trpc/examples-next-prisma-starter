import { bool, envsafe, num, str, url } from 'envsafe';

if (typeof window !== 'undefined') {
  throw new Error('This should not be imported in the browser');
}
/*eslint sort-keys: "error"*/
export const env = envsafe({
  ALGOLIA_ADMIN_KEY: str({
    devDefault: '2ae8cae03fcaa346cce1b2f62f898751',
  }),
  ALGOLIA_APP_ID: str({
    devDefault: 'EUY5ZIHDID',
  }),
  ALGOLIA_SEARCH_KEY: str({
    devDefault: '5dcab691bcc63cf47a1ee5ff8190d91c',
  }),
});
