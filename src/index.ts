import { parseOptionsAndParams } from "./options.js";
import { printFunctionApi } from "./cmd-info.js";
import { Console } from '@node-lambdas/core';
import { runFunction } from "./cmd-run.js";

export { runFunction } from './cmd-run.js';
export { serve } from './cmd-serve.js';

export function main(cliArgs: string[]) {
  const inputs = parseOptionsAndParams(cliArgs);
  Console.debug(inputs);

  const { options } = inputs;

  // if (options.serve) {
  //   return serve(options);
  // }

  if (options.info) {
    return printFunctionApi(inputs);
  }

  return runFunction(inputs);
}
