import { parseOptionsAndParams } from "./options.js";
import { printFunctionApi } from "./info.js";
import { Console } from '@node-lambdas/core';
import { runFunction } from "./run.js";
import { resolve, dirname } from "path";
// import { serve } from "./serve.js";

export const __dirname = resolve(dirname(decodeURI(new URL(import.meta.url).pathname)));

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
