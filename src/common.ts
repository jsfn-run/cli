const cloudDomain = process.env.FN_DOMAIN || 'jsfn.run';

export const defaultPort = 1234;
export const baseRequestOptions = {
  method: 'POST',
  headers: { 'user-agent': 'node-lambdas/cli' },
  timeout: 30_000,
};

export function readStream(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('error', reject);
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

import { CliInputs } from './options.js';

export function buildFunctionUrl(inputs: CliInputs): URL {
  const baseUrl = getServerUrl(inputs);
  const params = new URLSearchParams(inputs.params as Record<string, string>);

  const url = new URL(inputs.inputs.join('/'), baseUrl);
  url.protocol = baseUrl.protocol;
  url.search = params.toString();

  return url;
}

function getServerUrl(inputs: CliInputs) {
  const port = inputs.options.port || defaultPort;

  return new URL(
    inputs.options.local ? `http://localhost:${port}/` : `https://${getFunctionName(inputs)}.${cloudDomain}/`,
  );
}

function getFunctionName(inputs: CliInputs) {
  if (!inputs.name) {
    throw new Error('Function name not provided.');
  }

  return inputs.name;
}
