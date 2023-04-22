import { parseOptionsAndParams } from "./common.mjs";
import { printFunctionApi } from "./info.mjs";
import { runFunction } from "./run.mjs";
import { serve } from "./serve.mjs";
import { resolve, dirname } from "path";

export const __dirname = resolve(dirname(decodeURI(new URL(import.meta.url).pathname)));

export function main(cliArgs) {
  const { options, params } = parseOptionsAndParams(cliArgs);

  if (options.serve) {
    return serve(options);
  }

  if (options.info) {
    return printFunctionApi(options, params);
  }

  runFunction(options, params);
}
