/* eslint-disable @typescript-eslint/no-var-requires */
require('ts-node').register({
  compilerOptions: {
    target: 'es5',
    module: 'commonjs',
    types: ['node'],
  },
});

module.exports = require('./next.config.ts');
