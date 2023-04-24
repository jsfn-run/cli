export interface CliInputs {
  name: string;
  inputs: string[];
  options: Record<string, string | boolean>;
  params: Record<string, string | boolean>;
}

export function parseOptionsAndParams(args: string[]) {
  args = normalizeArgs(args);
  const output: CliInputs = {
    name: '',
    inputs: [],
    params: {},
    options: {},
  };

  for (let i = 0; i < args.length;) {
    const current = args[i];
    const next = args[i + 1];

    if (hasDashes(current)) {
      i += readValue(output.params, current.slice(2), next, hasDashes);
      continue;
    }

    if (hasPlusSign(current)) {
      i += readValue(output.options, current.slice(1), next, hasPlusSign);
      continue;
    }

    if (!output.name) {
      output.name = current;
      i++;
      continue;
    }

    output.inputs.push(current);
    i++;
  }

  return output;
}

function readValue(target: any, current: string, next: string, testNext: (s: string) => boolean) {
  if (current.includes('=')) {
    const [key, value] = current.split('=');
    target[key] = value;
    return 1;
  }

  if (next === undefined || testNext(next)) {
    target[current] = true;
    return 1;
  }

  target[current] = next;
  return 2;
}

function hasDashes(option: string) {
  return option.startsWith('--');
}

function hasPlusSign(option: string) {
  return option.charAt(0) === '+';
}

function normalizeArgs(args: string[]) {
  return args.map((arg) => (arg.charAt(0) === '@' ? '+stdin=' + arg.slice(1) : arg));
}
