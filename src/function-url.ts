import { defaultPort } from './common.js';
import { CliInputs } from './options.js';

const cloudDomain = process.env.FN_DOMAIN || 'jsfn.run';

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

  return new URL(inputs.options.local ? `http://localhost:${port}/` : `https://${getFunctionName(inputs)}.${cloudDomain}/`);
}

function getFunctionName(inputs: CliInputs) {
  if (!inputs.name) {
    throw new Error('Function name not provided.');
  }

  return inputs.name;
}
