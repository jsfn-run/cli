#!/usr/bin/env node

import { request as http } from 'http';
import { request as https } from 'https';
import { execSync as exec } from 'child_process';
import { join, resolve, dirname } from 'path';
import { existsSync, createReadStream } from 'fs';

// https://stackoverflow.com/a/51118243
const __dirname = resolve(dirname(decodeURI(new URL(import.meta.url).pathname)));
const CWD = process.cwd();
const DEFAULT_PORT = 1234;

const requestOptions = {
  method: 'POST',
  headers: { 'user-agent': 'node-lambdas/cli' },
  timeout: 30_000,
};

const onError = (message) => {
  process.stderr.write(String(message) + '\n');
  process.exit(1);
};

const cliArgs = process.argv.slice(2);

switch (cliArgs[0]) {
  case '--create':
    create(cliArgs);
    break;

  case '--serve':
    serve(cliArgs);
    break;

  default:
    run(cliArgs);
}

async function serve(args) {
  const { options } = splitOptionsAndParams(args);
  const pathToIndex = join(CWD, 'index.js');

  if (!existsSync(pathToIndex)) {
    onError('Cannot find index.js in ' + CWD + '. Are you in the right folder?');
  }

  if (!existsSync(join(CWD, 'node_modules', '@node-lambdas', 'core'))) {
    console.log('Installing @node-lambdas/core');
    exec('npm i --no-save @node-lambdas/core');
  }

  const port = options.port || DEFAULT_PORT;
  process.env.PORT = port;
  console.log(`Starting server on ${port}`);

  const fn = await import(pathToIndex);
  return fn;
}

function create(args) {
  const options = buildOptions(args);
  const from = options.from || 'echo';
  const name = options.create;

  if (!name) {
    onError('Name for new function was not provided');
    return;
  }

  const scriptPath = join(__dirname, 'create.sh');
  const execOptions = { stdio: 'pipe', encoding: 'utf8', cwd: process.cwd() };

  console.log(exec(`$SHELL ${scriptPath} ${name} ${from}`, execOptions));
}

function run(args, input = process.stdin, output = process.stdout) {
  const { options, params } = splitOptionsAndParams(args);
  const url = buildFunctionUrl(params, options);
  const stdin = options.stdin ? createReadStream(join(CWD, options.stdin)) : input;

  const onResponse = (response) => {
    const nextHeader = response.headers['x-next'];
    const next = nextHeader !== undefined ? parseArgs(nextHeader) : false;

    if (next) {
      run(next, response, output);
      return;
    }

    response.pipe(output);
  };

  const request = (url.protocol === 'http:' ? http : https)(url, requestOptions, onResponse);

  request.on('error', onError);
  stdin.pipe(request);
}

function splitOptionsAndParams(args) {
  const knownOptions = ['--port', '--local', '--stdin'];
  const normalArgs = normalizeArgs(args);
  const options = [];
  const params = [];

  normalArgs.forEach((arg) => {
    if (knownOptions.includes(arg.split('=')[0])) {
      options.push(arg);
    } else {
      params.push(arg);
    }
  });

  return { options: buildOptions(options), params };
}

function normalizeArgs(args) {
  const params = [];
  const addParam = (key, value) => params.push(value !== undefined ? key + '=' + value : key);
  args = args.map((arg) => (arg.charAt(0) === '@' ? '--stdin=' + arg.slice(1) : arg));

  forEachArg(args, addParam);

  return params;
}

function buildFunctionUrl(params, options) {
  const baseUrl = getBaseUrl(options, params);
  const normalizedParams = removeDashes(params);
  const urlParams = (normalizedParams.length && '?' + normalizedParams.join('&')) || '';

  return new URL(baseUrl + urlParams);
}

function getBaseUrl(options, params) {
  const isLocal = !!options.local;
  const fn = isLocal || getFunctionName(params);
  const action = getAction(params);
  const port = options.port || DEFAULT_PORT;

  return isLocal ? `http://localhost:${port}/${action}` : `https://${fn}.jsfn.run/${action}`;
}

function getAction(params) {
  return (params.length && !params[0].includes('=') && params.shift()) || '';
}

function getFunctionName(args) {
  const fn = args.shift();

  if (!fn) {
    onError('Function name not provided.');
  }

  return fn;
}

function removeDashes(params) {
  return params.map((p) => (hasDashes(p) ? p.slice(2) : p));
}

function hasDashes(option) {
  return option.startsWith('--');
}

function buildOptions(args) {
  const params = {};
  const addParam = (option, value) => {
    const key = hasDashes(option) ? option.slice(2) : option;
    params[key] = value;
  };

  forEachArg(args, addParam);

  return params;
}

function forEachArg(args, addParam) {
  args.forEach((arg) => {
    const isOption = hasDashes(arg);
    if (isOption && arg.includes('=')) {
      addParam(...arg.split('='));
      return;
    }

    if (isOption) {
      addParam(arg, true);
      return;
    }

    addParam(arg);
  });
}

function parseArgs(string) {
  return string.split(/\s+/);
}
