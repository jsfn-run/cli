const mockRequest = jest.fn();
const mockHttpsRequest = jest.fn();

jest.mock('http', () => ({ request: mockRequest }));
jest.mock('https', () => ({ request: mockHttpsRequest }));

import { EventEmitter } from 'events';
import { CliInputs } from './options';
import { printFunctionApi } from './cmd-info';
import { baseRequestOptions } from './common';

describe('request API details for a function', () => {
  it('should fetch API details from a function server and show them', async () => {
    const availableActions = [{
      default: false,
      name: 'foo',
      input: 'buffer',
      output: 'text',
      description: 'action description',
      options: {
        key: 'value',
      },
    }, {
      default: true,
      name: 'bar',
      credentials: ['authentication'],
      options: {},
    }];

    const json = JSON.stringify(availableActions);
    setupRequest(200, json);

    const inputs: CliInputs = {
      name: 'test',
      inputs: [],
      options: {},
      params: {},
    };

    const url = new URL('https://test.jsfn.run/api');
    const options = { ...baseRequestOptions, method: 'OPTIONS' };

    const result = await printFunctionApi(inputs);
    expect(result).toBe(null);
    expect(mockHttpsRequest).toHaveBeenCalledWith(url, options, expect.any(Function));
  });

  it('should fetch API details from a local server and show them', async () => {
    const availableActions = [{
      default: false,
      name: 'foo',
      input: 'buffer',
      output: 'text',
      description: 'action description',
      options: {
        key: 'value',
      },
    }];
    const json = JSON.stringify(availableActions);
    setupRequest(200, json, false);

    const inputs: CliInputs = {
      name: 'fn',
      inputs: [],
      options: { local: true },
      params: {},
    };

    const url = new URL('http://localhost:1234/api');
    const options = { ...baseRequestOptions, method: 'OPTIONS' };

    const result = await printFunctionApi(inputs);
    expect(result).toBe(null);
    expect(mockRequest).toHaveBeenCalledWith(url, options, expect.any(Function));
  });

  it('should fail if the API response is not 200', async () => {
    setupRequest(404, '');

    const inputs: CliInputs = {
      name: 'fn',
      inputs: [],
      options: {},
      params: {},
    };

    await expect(printFunctionApi(inputs)).rejects.toThrowError('Function not found');
  });

  it('should fail if the API response is not a valid JSON', async () => {
    setupRequest(200, '{}');

    const inputs: CliInputs = {
      name: 'fn',
      inputs: [],
      options: {},
      params: {},
    };

    await expect(printFunctionApi(inputs)).rejects.toThrowError('Invalid response from function server');
  });

  it('should show the JSON response if an input option was set', async () => {
    const json = '[]';
    setupRequest(200, json);
    jest.spyOn(console, 'log');

    const inputs: CliInputs = {
      name: 'fn',
      inputs: [],
      options: { json: true },
      params: {},
    };

    await expect(printFunctionApi(inputs)).resolves.toBe(null);
    expect(console.log).toHaveBeenCalledWith(json);
  });
});

function setupRequest(statusCode, json: string, https = true) {
  const response: any = new EventEmitter();
  response.statusCode = statusCode;

  (https ? mockHttpsRequest : mockRequest).mockImplementation((_a, _b, cb) => {
    cb(response);
    return {
      end: jest.fn(() => {
        response.emit('data', Buffer.from(json));
        response.emit('end');
      }),
    };
  });
}
