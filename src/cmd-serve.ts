import { existsSync } from "node:fs";
import { join } from "node:path";
import { defaultPort, loadModule } from "./common.js";
import { Console, lambda } from '@node-lambdas/core';

const CWD = process.cwd();

interface Options {
  port?: number;
}

export async function serve(options: Options) {
  const pathToIndex = join(CWD, "index.js");
  const port = Number([options.port, process.env.PORT, defaultPort].find(Boolean));

  if (!existsSync(pathToIndex)) {
    Console.error(
      "Cannot find index.js in " + CWD + ". Are you in the right folder?"
    );
  }

  Console.info(`Starting server on ${port}`);

  const fn = await loadModule(pathToIndex);
  return lambda(fn.default);
}
