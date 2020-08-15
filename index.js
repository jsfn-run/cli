#!/usr/bin/env node

import { request as http } from 'https';
import { execSync as exec } from 'child_process';
import { join, resolve, dirname } from 'path';

// https://stackoverflow.com/a/51118243
const __dirname = resolve(dirname(decodeURI(new URL(import.meta.url).pathname)));

const onError = (message) => {
  process.stderr.write(String(message) + '\n');
  process.exit(1);
};

const args = process.argv.slice(2);

if (args[0] === '--create') {
  create();
} else {
  run();
}

function create() {
  const name = args[1];
  if (!name) {
    onError('Name for new function was not provided');
    return;
  }

  const scriptPath = join(__dirname, 'create.sh');
  console.log(exec(`$SHELL ${scriptPath} ${name}`, { stdio: 'pipe', encoding: 'utf8', cwd: process.cwd() }));
}

function run() {
  const fn = args.shift();

  if (!fn) {
    onError('Function name not provided.');
    return;
  }

  const url = new URL(`https://${fn}.jsfn.run/${args.join('/')}`);
  const options = {
    method: 'POST',
    headers: { 'user-agent': 'node-lambdas/cli' },
    timeout: 30_000,
  };

  const request = http(url, options, (response) => response.pipe(process.stdout));
  request.on('error', onError);
  process.stdin.pipe(request);
}