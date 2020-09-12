import { execSync as exec } from 'child_process';
import { Console, DEFAULT_PORT, parseOptionsAndParams } from './common.js';
import { join } from 'path';
import { existsSync } from 'fs';

const CWD = process.cwd();

export async function serve(args) {
  const { options } = parseOptionsAndParams(args);
  const pathToIndex = join(CWD, 'index.js');

  if (!existsSync(pathToIndex)) {
    Console.error('Cannot find index.js in ' + CWD + '. Are you in the right folder?');
  }

  if (!existsSync(join(CWD, 'node_modules', '@node-lambdas', 'core'))) {
    Console.info('Installing @node-lambdas/core');
    exec('npm i --no-save @node-lambdas/core');
  }

  const port = options.port || DEFAULT_PORT;
  process.env.PORT = port;
  Console.info(`Starting server on ${port}`);

  return await import(pathToIndex);
}
