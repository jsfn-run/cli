import { existsSync } from "fs";
import { join } from "path";
import { defaultPort } from "./common.js";
import { Console, lambda } from '@node-lambdas/core';

const CWD = process.cwd();

interface Options {
  port?: number;
}

export async function serve(options: Options) {
  const pathToIndex = join(CWD, "index.js");

  if (!existsSync(pathToIndex)) {
    Console.error(
      "Cannot find index.js in " + CWD + ". Are you in the right folder?"
    );
  }

  const port = Number(options.port || process.env.PORT || defaultPort);
  Console.info(`Starting server on ${port}`);

  const fn = await import(pathToIndex);
  return lambda(fn.default);
}
