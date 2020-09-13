import { request as http } from 'http';
import { request as https } from 'https';
import { existsSync, createReadStream, readFileSync } from 'fs';
import { join } from 'path';
import { baseRequestOptions, buildFunctionUrl, Console, parseOptionsAndParams } from './common.js';

const CWD = process.cwd();

async function readCredentials(options, params) {
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

export async function runFunction(options, params, input = process.stdin, output = process.stdout) {
  const credentials = options.auth ? await readCredentials(options, params) : null;
  const url = buildFunctionUrl(options, params);
  const stdin = options.stdin ? createReadStream(join(CWD, options.stdin)) : input;

  const onResponse = (response) => {
    const nextHeader = response.headers['x-next'];
    const next = nextHeader !== undefined ? parseArgs(nextHeader) : false;

    if (next) {
      runFunction(options, next, input, output);
      return;
    }

    response.pipe(output);
  };

  const requestOptions = { ...baseRequestOptions };
  if (credentials) {
    const token = Buffer.from(JSON.stringify(credentials), 'utf-8').toString('base64');
    requestOptions.headers.authorization = 'Bearer ' + token;
  }

  const request = (url.protocol === 'http:' ? http : https)(url, requestOptions, onResponse);

  request.on('error', (message) => Console.error(message));
  stdin.pipe(request);
}

function parseArgs(string) {
  return string.split(/\s+/);
}
