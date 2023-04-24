import { createReadStream, existsSync, readFileSync } from 'fs';
import { request as http, RequestOptions } from 'http';
import { request as https } from 'https';
import { join } from 'path';
import { Console } from '@node-lambdas/core';
import { baseRequestOptions } from './common.js';
import { CliInputs } from './options.js';
import { buildFunctionUrl } from './function-url.js';

const CWD = process.cwd();

export async function runFunction(inputs: CliInputs, input = process.stdin, output = process.stdout) {
  const { options } = inputs;
  const credentials = options.auth ? await readCredentials(inputs) : null;
  const url = buildFunctionUrl(inputs);
  const stdin = options.stdin ? createReadStream(join(CWD, String(options.stdin))) : input;

  const onResponse = (response) => {
    // TODO
    // const nextHeader = response.headers['x-next'];
    // const next = nextHeader !== undefined ? parseArgs(nextHeader) : false;

    // if (next) {
    //   runFunction(options, next, input, output);
    //   return;
    // }

    if (response.statusCode !== 200) {
      output.write(response.statusCode + ' ' + response.statusMessage + '\n');
      response.on('end', () => process.exit(1));
      response.pipe(process.stderr);
      return;
    }

    response.pipe(output);
  };

  const requestOptions: RequestOptions = { ...baseRequestOptions };

  if (credentials) {
    const token = Buffer.from(JSON.stringify(credentials), 'utf-8').toString('base64');
    requestOptions.headers.authorization = 'Bearer ' + token;
  }

  Console.debug(String(url), requestOptions);

  const request = (url.protocol === 'http:' ? http : https)(url, requestOptions, onResponse);
  request.on('error', (message) => Console.error(message));

  if (options.data) {
    request.write(options.data);
    request.end();
    return;
  }

  stdin.pipe(request);
}

async function readCredentials({ options, params }) {
  const filePath = join(CWD, 'credentials.json');
  const propertyPath = options.auth === 'true' ? ['default', params[0]] : options.auth.trim().split('/');
  const [groupName, functionName] = propertyPath;

  if (existsSync(filePath)) {
    try {
      const credentials = JSON.parse(readFileSync(filePath).toString('utf-8'));
      const group = credentials[groupName];
      return (group && group[functionName]) || {};
    } catch (error) {
      Console.error(error);
    }
  }

  Console.error(
    `Invalid credentials: ${groupName}/${functionName}. Check if credentials.json exists and is a valid JSON file.`,
  );
}
