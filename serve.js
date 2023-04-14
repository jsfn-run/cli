import { execSync as exec } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { Console, DEFAULT_PORT } from './common.js';

const CWD = process.cwd();

export async function serve(options) {
  const pathToIndex = join(CWD, 'index.js');

  if (!existsSync(pathToIndex)) {
    Console.error('Cannot find index.js in ' + CWD + '. Are you in the right folder?');
  }

  if (!existsSync(join(CWD, 'node_modules', '@node-lambdas', 'core'))) {
    Console.info('Installing @node-lambdas/core');
    exec('npm i --no-save @node-lambdas/core');
  }

  const port = Number(options.port || process.env.PORT || DEFAULT_PORT);
  Console.info(`Starting server on ${port}`);

  return await import(pathToIndex);
}
