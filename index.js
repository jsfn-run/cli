#!/usr/bin/env node

import { resolve, dirname } from 'path';
import { parseOptionsAndParams } from './common.js';
import { createProject } from './create.js';
import { printFunctionApi } from './info.js';
import { runFunction } from './run.js';
import { serve } from './serve.js';

// https://stackoverflow.com/a/51118243
const __dirname = resolve(dirname(decodeURI(new URL(import.meta.url).pathname)));

function main(cliArgs) {
  const { options, params } = parseOptionsAndParams(cliArgs);

  if (options.create) {
    return createProject(cliArgs, __dirname);
  }

  if (options.serve) {
    return serve(cliArgs);
  }

  if (options.info) {
    return printFunctionApi(cliArgs);
  }

  runFunction(cliArgs);
}

main(process.argv.slice(2));
