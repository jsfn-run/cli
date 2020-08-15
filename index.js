#!/usr/bin/env node

import { request as http } from 'https';

const onError = (message) => {
  process.stderr.write(String(message));
  process.exit(1);
};

const args = process.argv.slice(2);
const fn = args.shift();

if (!fn) {
  onError('Function name not provided.');
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
