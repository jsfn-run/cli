#!/usr/bin/env node

import { request as http } from 'http';
import { request as https } from 'https';
import { execSync as exec } from 'child_process';
import { join, resolve, dirname } from 'path';
import { existsSync, createReadStream, readFileSync } from 'fs';

const cloudDomain = process.env.FN_DOMAIN || 'jsfn.run';

const colors = {
  error: '\u001b[33;1m',
  info: '\u001b[34;1m',
  log: '\u001b[37;1m',
  reset: '\u001b[0m',
};

const Console = {
  write(type, ...values) {
    console.log(colors[type], ' ', ...values, colors.reset);
  },

  log(...args) {
    Console.write('log', ...args);
  },

  info(...args) {
    Console.write('info', ...args);
  },

  error(...args) {
    Console.write('error', ...args);
    process.exit(1);
  },
};

// https://stackoverflow.com/a/51118243
const __dirname = resolve(dirname(decodeURI(new URL(import.meta.url).pathname)));
const CWD = process.cwd();
const DEFAULT_PORT = 1234;

const requestOptions = {
  method: 'POST',
  headers: { 'user-agent': 'node-lambdas/cli' },
  timeout: 30_000,
};

const cliArgs = process.argv.slice(2);

switch (cliArgs[0]) {
  case '+create':
    cliArgs.shift();
    create(cliArgs);
    break;

  case '+serve':
    serve(cliArgs);
    break;

  case '+info':
    showInfo(cliArgs);
    break;

  default:
    run(cliArgs);
}

async function readCredentials(groupName, functionName) {
  const filePath = join(process.cwd(), 'credentials.json');

  if (existsSync(filePath)) {
    try {
      const credentials = JSON.parse(readFileSync(filePath).toString('utf-8'));
      const group = credentials[groupName === 'true' ? 'default' : groupName];
      return (group && group[functionName]) || {};
    } catch {}
  }

  Console.error('Invalid credentials. Check if credentials.json exists and is a valid JSON file.');
}

function showInfo(args) {
  const { options } = splitOptionsAndParams(args);
  const url = buildFunctionUrl(['api'], options);
  const onResponse = (response) => {
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const buffer = Buffer.concat(chunks);
      showApiOptions(buffer.toString('utf8'), options);
    });
  };
  const reqOptions = { ...requestOptions, method: 'OPTIONS' };
  const request = (url.protocol === 'http:' ? http : https)(url, reqOptions, onResponse);
  request.end();
}

function showApiOptions(json, options) {
  if (options.json) {
    return console.log(json);
  }

  try {
    const actionList = JSON.parse(json);
    console.log('');
    actionList.forEach((action) => {
      console.log(
        colors.error + '> fn ' + (action.default ? '*' : '') + colors.info + action.name + colors.log,
        Object.entries(action.options)
          .map(([key, value]) => ' --' + key + '=<' + value + '>')
          .join(' ') + colors.reset,
      );

      if (action.description) {
        console.log('\n' + colors.log + action.description + colors.reset);
      }

      console.log(colors.log + action.input + ' => ' + action.output + colors.reset);

      if (action.credentials.length) {
        console.log(colors.error + '\nCredentials:\n  ' + colors.log + action.credentials.join(', ') + colors.reset);
      }

      console.log('');
    });
  } catch (error) {
    Console.error("I'm unable to fetch API details:", error.message);
  }
}

async function serve(args) {
  const { options } = splitOptionsAndParams(args);
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

  const fn = await import(pathToIndex);
  return fn;
}

function create(args) {
  const options = buildOptions(args);
  const from = options.from || 'echo';
  const name = args.pop();

  if (!name) {
    Console.error('Name for new function was not provided');
    return;
  }

  const scriptPath = join(__dirname, 'create.sh');
  const execOptions = { stdio: 'pipe', encoding: 'utf8', cwd: process.cwd() };

  Console.info(exec(`$SHELL ${scriptPath} ${name} ${from}`, execOptions));
}

async function run(args, input = process.stdin, output = process.stdout) {
  const { options, params } = splitOptionsAndParams(args);
  const credentials = options.auth ? await readCredentials(options.auth, params[0]) : null;
  const url = buildFunctionUrl(params, options);
  const stdin = options.stdin ? createReadStream(join(CWD, options.stdin)) : input;

  const onResponse = (response) => {
    const nextHeader = response.headers['x-next'];
    const next = nextHeader !== undefined ? parseArgs(nextHeader) : false;

    if (next) {
      run(next, input, output);
      return;
    }

    response.pipe(output);
  };

  if (credentials) {
    Object.entries(credentials).forEach(([key, value]) => {
      requestOptions.headers[key] = value;
    });
  }

  const request = (url.protocol === 'http:' ? http : https)(url, requestOptions, onResponse);

  request.on('error', (message) => Console.error(message));
  stdin.pipe(request);
}

function splitOptionsAndParams(args) {
  const normalArgs = normalizeArgs(args);
  const options = [];
  const params = [];

  normalArgs.forEach((arg) => {
    if (arg.charAt(0) === '+') {
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

  return isLocal ? `http://localhost:${port}/${action}` : `https://${fn}.${cloudDomain}/${action}`;
}

function getAction(params) {
  return (params.length && !params[0].includes('=') && params.shift()) || '';
}

function getFunctionName(args) {
  const fn = args.shift();

  if (!fn) {
    Console.error('Function name not provided.');
  }

  return fn;
}

function removeDashes(params) {
  return params.map((p) => (hasDashes(p) ? p.slice(2) : p));
}

function hasDashes(option) {
  return option.startsWith('--');
}

function isCliOption(option) {
  return option.charAt(0) === '+';
}

function buildOptions(args) {
  const params = {};
  const addParam = (option, value) => {
    const key = hasDashes(option) ? option.slice(2) : isCliOption(option) ? option.slice(1) : option;
    params[key] = value;
  };

  forEachArg(args, addParam);

  return params;
}

function forEachArg(args, addParam) {
  args.forEach((arg) => {
    const isOption = hasDashes(arg) || isCliOption(arg);
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
