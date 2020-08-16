#!/usr/bin/env node

import { request as http } from 'https';
import { execSync as exec, spawn } from 'child_process';
import { join, resolve, dirname } from 'path';
import { existsSync } from 'fs';

// https://stackoverflow.com/a/51118243
const __dirname = resolve(dirname(decodeURI(new URL(import.meta.url).pathname)));
const CWD = process.cwd();

const onError = (message) => {
  process.stderr.write(String(message) + '\n');
  process.exit(1);
};

const args = process.argv.slice(2);

switch (args[0]) {
  case '--create':
    args.shift();
    create();
    break;

  case '--serve':
    serve();
    break;

  default:
    run();
}

async function serve() {
  if (!existsSync(join(CWD, 'index.js'))) {
    onError('Cannot find index.js. Are you in the right folder?');
  }

  if (!existsSync(join(CWD, 'node_modules', '@node-lambdas', 'core'))) {
    console.log('Installing @node-lambdas/core');
    exec('npm i --no-save @node-lambdas/core');
  }

  const port = process.env.PORT = 3000 + Math.round(Math.random() * 4000);
  console.log(`Starting server on ${port}`);
  exec('node index.js', { env: process.env, stdio: 'pipe', cwd: CWD });
}

function create() {
  let from = 'echo';
  if (args[0] === '--from') {
    args.shift();
    from = args.shift();
  }

  const name = args[0];
  if (!name) {
    onError('Name for new function was not provided');
    return;
  }

  const scriptPath = join(__dirname, 'create.sh');
  console.log(exec(`$SHELL ${scriptPath} ${name} ${from}`, { stdio: 'pipe', encoding: 'utf8', cwd: process.cwd() }));
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