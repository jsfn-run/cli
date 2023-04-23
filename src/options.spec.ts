import { parseOptionsAndParams } from './options';

describe('read options from an array of strings', () => {
  it('should read boolean inputs', () => {
    const input = ['+option', 'name', '--param'];
    const expected = {
      names: [],
      options: { option: 'name' },
      params: { param: true }
    };

    expect(parseOptionsAndParams(input)).toEqual(expected);
  });

  it('should read a file reference as input', () => {
    const input = ['@file.txt', 'run'];
    const expected = {
      names: ['run'],
      options: { stdin: 'file.txt' },
      params: {}
    };

    expect(parseOptionsAndParams(input)).toEqual(expected);
  });

  it('should read function parameters and options in separated objects', () => {
    const input = ['skip-me', '+debug', '+port=123', '+stdin', 'file.txt', '--key=value', '--flag', '--name', 'bob', 'something', 'else'];
    const expected = {
      names: ['skip-me', 'something', 'else'],
      options: {
        debug: true,
        port: '123',
        stdin: 'file.txt'
      },
      params: {
        key: 'value',
        flag: true,
        name: 'bob',
      }
    };

    expect(parseOptionsAndParams(input)).toEqual(expected);
  });
});