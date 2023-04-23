import { CliInputs } from './options';

const cloudDomain = process.env.FN_DOMAIN || 'jsfn.run';

export const baseRequestOptions = {
  method: 'POST',
  headers: { 'user-agent': 'node-lambdas/cli' },
  timeout: 30_000,
};

export const DEFAULT_PORT = 1234;

/*export function removeDashes(params: string[]) {
  return params.map((p) => (hasDashes(p) ? p.slice(2) : p));
}

export function hasDashes(option) {
  return option.startsWith('--');
}
*/
export function buildFunctionUrl(inputs: CliInputs) {
  const baseUrl = getFunctionServerUrl(inputs);
  // const normalizedParams = removeDashes(params.slice(options.local ? 1 : 2));
  const normalizedParams = [];
  const urlParams = (normalizedParams.length && '?' + normalizedParams.join('&')) || '';
  return new URL(baseUrl + urlParams);
}

export function getFunctionServerUrl(inputs: CliInputs) {
  const functionName = getFunctionName(inputs);
  const action = getActionName(inputs);
  const port = inputs.options.port || DEFAULT_PORT;

  return inputs.options.local ? `http://localhost:${port}/${action}` : `https://${functionName}.${cloudDomain}/${action}`;
}

function getActionName(inputs: CliInputs) {
  return inputs.names[1] || '';
  // const paramsWithoutOptions = params.filter((p) => !hasDashes(p));
  // const param = options.local ? paramsWithoutOptions[0] : paramsWithoutOptions[1];
  // return param || '';
}

export function getFunctionName(inputs: CliInputs) {
  if (inputs.options.local) {
    return '';
  }


  const fn = inputs.names[0];

  if (!fn) {
    throw new Error('Function name not provided.');
  }

  return fn;
}
