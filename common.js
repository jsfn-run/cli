const cloudDomain = process.env.FN_DOMAIN || 'jsfn.run';
export const Colors = {
  error: '\u001b[33;1m',
  info: '\u001b[34;1m',
  log: '\u001b[37;1m',
  reset: '\u001b[0m',
};
export const baseRequestOptions = {
  method: 'POST',
  headers: { 'user-agent': 'node-lambdas/cli' },
  timeout: 30_000,
};

export const DEFAULT_PORT = 1234;
export function parseOptionsAndParams(args) {
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

  params.sort((a, b) => (hasDashes(b) ? -1 : 0));

  return { options: createOptionMap(options), params };
}

function createOptionMap(args) {
  const params = {};
  const addParam = (option, value) => {
    const key = hasDashes(option) ? option.slice(2) : isCliOption(option) ? option.slice(1) : option;
    params[key] = value;
  };

  mapArguments(args, addParam);

  return params;
}

export function normalizeArgs(args) {
  const argsWithStdIn = args.map((arg) => (arg.charAt(0) === '@' ? '+stdin=' + arg.slice(1) : arg));
  return mapArguments(argsWithStdIn, (key, value) => (value !== undefined ? key + '=' + value : key));
}

export function mapArguments(args, map) {
  return args.map((arg) => {
    const isOption = hasDashes(arg) || isCliOption(arg);
    if (isOption && arg.includes('=')) {
      return map(...arg.split('='));
    }

    if (isOption) {
      return map(arg, true);
    }

    return map(arg);
  });
}

export function removeDashes(params) {
  return params.map((p) => (hasDashes(p) ? p.slice(2) : p));
}

export function hasDashes(option) {
  return option.startsWith('--');
}

export function isCliOption(option) {
  return option.charAt(0) === '+';
}

export function buildFunctionUrl(options, params) {
  const baseUrl = getBaseUrl(options, params);
  const normalizedParams = removeDashes(params.slice(options.local ? 1 : 2));
  const urlParams = (normalizedParams.length && '?' + normalizedParams.join('&')) || '';

  return new URL(baseUrl + urlParams);
}

export function getBaseUrl(options, params) {
  const functionName = getFunctionName(options, params);
  const action = getActionName(options, params);
  const port = options.port || DEFAULT_PORT;

  return options.local ? `http://localhost:${port}/${action}` : `https://${functionName}.${cloudDomain}/${action}`;
}

function getActionName(options, params) {
  const paramsWithoutOptions = params.filter((p) => !hasDashes(p));
  const param = options.local ? paramsWithoutOptions[0] : paramsWithoutOptions[1];
  return param || '';
}

export function getFunctionName(options, params) {
  if (options.local) {
    return '';
  }

  const fn = params[0];

  if (!fn) {
    Console.error('Function name not provided.');
  }

  return fn;
}

export const Console = {
  write(type, ...values) {
    console.log(Colors[type], ' ', ...values, Colors.reset);
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
