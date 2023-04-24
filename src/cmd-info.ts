import http from 'http';
import https from 'https';
import { baseRequestOptions, readStream } from './common.js';
import { CliInputs } from './options.js';
import { buildFunctionUrl } from './function-url.js';

export const Colors = {
  error: '\u001b[33;1m',
  info: '\u001b[34;1m',
  log: '\u001b[37;1m',
  reset: '\u001b[0m',
};

export function printFunctionApi(inputs: CliInputs) {
  inputs.inputs.push('api');
  const url = buildFunctionUrl(inputs);

  return new Promise((resolve, reject) => {
    const onResponse = async (response) => {
      if (response.statusCode !== 200) {
        reject(new Error('Function not found'));
        return;
      }

      const buffer = await readStream(response);
      try {
        showApiOptions(buffer.toString('utf8'), inputs);
        resolve(null);
      } catch (error) {
        reject(error);
      }
    };

    const reqOptions = { ...baseRequestOptions, method: 'OPTIONS' };
    const httpRequest = url.protocol === 'http:' ? http.request : https.request;
    const request = httpRequest(url, reqOptions, onResponse);
    request.end();
  });
}

function showApiOptions(json: string, inputs: CliInputs) {
  if (inputs.options.json) {
    return console.log(json);
  }

  const functionName = inputs.options.local ? '+local=1' : inputs.name;

  const actionList = JSON.parse(json);

  if (!Array.isArray(actionList)) {
    throw new Error('Invalid response from function server');
  }

  const output: string[] = [''];

  actionList.forEach((action) => {
    output.push(
      Colors.error + (action.default ? '*' : ' ') + ' fn ' + functionName + ' ' + action.name + Colors.log +
      Object.entries(action.options)
        .map(([key, value]) => ' --' + key + '=<' + value + '>')
        .join(' ') + Colors.reset

    );

    if (action.description) {
      output.push('\n' + Colors.log + action.description + Colors.reset);
    }

    output.push(Colors.log + (action.input || 'raw') + ' => ' + (action.output || 'raw') + Colors.reset);

    if (action.credentials?.length) {
      output.push(Colors.error + 'credentials: ' + Colors.log + action.credentials.join(', ') + Colors.reset);
    }
    output.push('');
  });

  console.log(output.join('\n') + '\n');
}
