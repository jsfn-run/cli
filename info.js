import { request as http } from 'http';
import { request as https } from 'https';
import { baseRequestOptions, buildFunctionUrl, Colors, Console } from './common.js';

export function printFunctionApi(options, params) {
  const urlParams = options.local ? ['api'] : [params[0], 'api'];
  const url = buildFunctionUrl(options, urlParams);

  const onResponse = (response) => {
    if (response.statusCode !== 200) {
      Console.error('Function not found');
      return;
    }

    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const buffer = Buffer.concat(chunks);
      showApiOptions(buffer.toString('utf8'), options, params);
    });
  };

  const reqOptions = { ...baseRequestOptions, method: 'OPTIONS' };
  const request = (options.local ? http : https)(url, reqOptions, onResponse);
  request.end();
}

function showApiOptions(json, options, params) {
  if (options.json) {
    return console.log(json);
  }

  const functionName = options.local ? '+local' : params[0];

  try {
    const actionList = JSON.parse(json);
    console.log('');
    actionList.forEach((action) => {
      console.log(
        Colors.error + (action.default ? '*' : ' ') + ' fn ' + functionName + ' ' + action.name + Colors.log,
        Object.entries(action.options)
          .map(([key, value]) => ' --' + key + '=<' + value + '>')
          .join(' ') + Colors.reset,
      );

      if (action.description) {
        console.log('\n' + Colors.log + action.description + Colors.reset);
      }

      console.log(Colors.error + 'Format: ' + Colors.log + action.input + ' => ' + action.output + Colors.reset);

      if (action.credentials.length) {
        console.log(Colors.error + 'Credentials: ' + Colors.log + action.credentials.join(', ') + Colors.reset);
      }

      console.log('');
    });
  } catch (error) {
    Console.error("I'm unable to fetch API details:", error.message);
  }
}
