#!/usr/bin/env node

import main from '..';

main().then(() => console.log('Done!')).catch(err => console.log(err));
