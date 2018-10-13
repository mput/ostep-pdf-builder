#!/usr/bin/env node

import main from '..';

main()
  .then(() => console.log('Done!'))
  .catch((err) => {
    console.error('%s', err);
    process.exit(1);
  });
