import { buildFunctionUrl } from './common';
import { CliInputs } from './options';

describe('buildFunctionUrl', () => {
  it('should build an URL from inputs', () => {
    const inputs: CliInputs = {
      options: {},
      params: {},
      names: ['test']
    };

    const url = buildFunctionUrl(inputs);

    expect(String(url)).toBe('https://test.jsfn.run/');
  });
});