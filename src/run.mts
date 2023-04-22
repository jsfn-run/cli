import { createReadStream, existsSync, readFileSync } from 'fs';
import { request as http, RequestOptions } from 'http';
import { request as https } from 'https';
import { join } from 'path';
import { baseRequestOptions, buildFunctionUrl, Console } from './common.mjs';

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

    if (response.statusCode !== 200) {
      output.write(response.statusCode + ' ' + response.statusMessage + '\n');
      response.pipe(process.stderr);
      process.exit(1);
    }

    response.pipe(output);
  };

  const requestOptions: RequestOptions = { ...baseRequestOptions };
  if (credentials) {
    const token = Buffer.from(JSON.stringify(credentials), 'utf-8').toString('base64');
    requestOptions.headers.authorization = 'Bearer ' + token;
  }

  if (options.debug) {
    Console.log(String(url), requestOptions);
  }

  const request = (url.protocol === 'http:' ? http : https)(url, requestOptions, onResponse);

  request.on('error', (message) => Console.error(message));
  if (options.data) {
    request.write(options.data);
    request.end();
    return;
  }

  stdin.pipe(request);
}

function parseArgs(string) {
  return string.split(/\s+/);
}
