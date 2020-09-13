import { parseOptionsAndParams } from './common.js';
import { createProject } from './create.js';
import { printFunctionApi } from './info.js';
import { runFunction } from './run.js';
import { serve } from './serve.js';
import { resolve, dirname } from 'path';

// https://stackoverflow.com/a/51118243
const __dirname = resolve(dirname(decodeURI(new URL(import.meta.url).pathname)));

export function main(cliArgs) {
  const { options, params } = parseOptionsAndParams(cliArgs);

  if (options.create) {
    return createProject(options, params, __dirname);
  }

  if (options.serve) {
    return serve(options);
  }

  if (options.info) {
    return printFunctionApi(options, params);
  }

  runFunction(options, params);
}
