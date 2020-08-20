#!/usr/bin/env node

import { request as http } from 'http';
import { request as https } from 'https';
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

const cliArgs = process.argv.slice(2);

switch (cliArgs[0]) {
  case '--create':
  case '--new':
    cliArgs.shift();
    create();
    break;

  case '--serve':
    serve();
    break;

  default:
    run(cliArgs.slice());
}

async function serve() {
  const pathToIndex = join(CWD, 'index.js');

  if (!existsSync(pathToIndex)) {
    onError('Cannot find index.js in ' + CWD + '. Are you in the right folder?');
  }

  if (!existsSync(join(CWD, 'node_modules', '@node-lambdas', 'core'))) {
    console.log('Installing @node-lambdas/core');
    exec('npm i --no-save @node-lambdas/core');
  }

  const port = process.env.PORT = 1234;
  console.log(`Starting server on ${port}`);

  const fn = await import(pathToIndex);
  return fn;
}

function create() {
  let from = 'echo';
  if (cliArgs[0] === '--from') {
    cliArgs.shift();
    from = cliArgs.shift();
  }

  const name = cliArgs[0];
  if (!name) {
    onError('Name for new function was not provided');
    return;
  }

  const scriptPath = join(__dirname, 'create.sh');
  console.log(exec(`$SHELL ${scriptPath} ${name} ${from}`, { stdio: 'pipe', encoding: 'utf8', cwd: process.cwd() }));
}

function run(args) {
  const splitIndex = args.indexOf('--');
  const options = splitIndex !== -1 ? args.slice(0, splitIndex) : args;
  const fnArgs = splitIndex !== -1 ? args.slice(splitIndex + 1) : args;

  const url = getFunctionUrl(fnArgs, options);
  const requestOptions = {
    method: 'POST',
    headers: { 'user-agent': 'node-lambdas/cli' },
    timeout: 30_000,
  };

  const request = (url.protocol === 'http:' ? http : https)(url, requestOptions, (response) => response.pipe(process.stdout));
  request.on('error', onError);
  process.stdin.pipe(request);
}

function getFunctionUrl(args, options) {
  const isLocal = options.includes('--local');
  const fn = !isLocal && getFunctionName(args);
  const action = args.shift() || '';
  const params = argsToParams(args);
  const baseUrl = isLocal ? `http://localhost:1234/${action}` : `https://${fn}.jsfn.run/${action}`;

  return new URL(baseUrl + (params.length && '?' + params.join('&') || ''))
}

function getFunctionName(args) {
  const fn = args.shift();

  if (!fn) {
    onError('Function name not provided.');
  }

  return fn;
}

function argsToParams(args) {
  const params = [];
  const addParam = (key, value) => params.push(key + '=' + encodeURIComponent(value));
  let cursor = 0;

  for (; cursor < args.length;) {
    if (args[cursor].includes('=')) {
      addParam(...args[cursor++].slice(2).split('='));
    } else {
      addParam(args[cursor++].slice(2), args[cursor++]);
    }
  }

  return params;
}