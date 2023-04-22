import { request } from 'http';
import { request as request$1 } from 'https';
import { createReadStream, existsSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { execSync } from 'child_process';

const cloudDomain = process.env.FN_DOMAIN || 'jsfn.run';
const Colors = {
    error: '\u001b[33;1m',
    info: '\u001b[34;1m',
    log: '\u001b[37;1m',
    reset: '\u001b[0m',
};
const baseRequestOptions = {
    method: 'POST',
    headers: { 'user-agent': 'node-lambdas/cli' },
    timeout: 30000,
};
const DEFAULT_PORT = 1234;
function parseOptionsAndParams(args) {
    const normalArgs = normalizeArgs(args);
    const options = [];
    const params = [];
    normalArgs.forEach((arg) => {
        if (arg.charAt(0) === '+') {
            options.push(arg);
        }
        else {
            params.push(arg);
        }
    });
    params.sort((_a, b) => (hasDashes(b) ? -1 : 0));
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
function normalizeArgs(args) {
    const argsWithStdIn = args.map((arg) => (arg.charAt(0) === '@' ? '+stdin=' + arg.slice(1) : arg));
    return mapArguments(argsWithStdIn, (key, value) => (value !== undefined ? `${key}=${value}` : key));
}
function mapArguments(args, map) {
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
function removeDashes(params) {
    return params.map((p) => (hasDashes(p) ? p.slice(2) : p));
}
function hasDashes(option) {
    return option.startsWith('--');
}
function isCliOption(option) {
    return option.charAt(0) === '+';
}
function buildFunctionUrl(options, params) {
    const baseUrl = getBaseUrl(options, params);
    const normalizedParams = removeDashes(params.slice(options.local ? 1 : 2));
    const urlParams = (normalizedParams.length && '?' + normalizedParams.join('&')) || '';
    return new URL(baseUrl + urlParams);
}
function getBaseUrl(options, params) {
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
function getFunctionName(options, params) {
    if (options.local) {
        return '';
    }
    const fn = params[0];
    if (!fn) {
        Console.error('Function name not provided.');
    }
    return fn;
}
const Console = {
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

function printFunctionApi(options, params) {
    const urlParams = options.local ? ["api"] : [params[0], "api"];
    const url = buildFunctionUrl(options, urlParams);
    const onResponse = (response) => {
        if (response.statusCode !== 200) {
            Console.error("Function not found");
            return;
        }
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
            const buffer = Buffer.concat(chunks);
            showApiOptions(buffer.toString("utf8"), options, params);
        });
    };
    const reqOptions = { ...baseRequestOptions, method: "OPTIONS" };
    const request$2 = (options.local ? request : request$1)(url, reqOptions, onResponse);
    request$2.end();
}
function showApiOptions(json, options, params) {
    if (options.json) {
        return console.log(json);
    }
    const functionName = options.local ? "+local" : params[0];
    try {
        const actionList = JSON.parse(json);
        console.log("");
        actionList.forEach((action) => {
            console.log(Colors.error +
                (action.default ? "*" : " ") +
                " fn " +
                functionName +
                " " +
                action.name +
                Colors.log, Object.entries(action.options)
                .map(([key, value]) => " --" + key + "=<" + value + ">")
                .join(" ") + Colors.reset);
            if (action.description) {
                console.log("\n" + Colors.log + action.description + Colors.reset);
            }
            console.log(Colors.error +
                "Format: " +
                Colors.log +
                action.input +
                " => " +
                action.output +
                Colors.reset);
            if (action.credentials.length) {
                console.log(Colors.error +
                    "Credentials: " +
                    Colors.log +
                    action.credentials.join(", ") +
                    Colors.reset);
            }
            console.log("");
        });
    }
    catch (error) {
        Console.error("I'm unable to fetch API details:", error.message);
    }
}

const CWD$1 = process.cwd();
async function readCredentials(options, params) {
    const filePath = join(CWD$1, 'credentials.json');
    const propertyPath = options.auth === 'true' ? ['default', params[0]] : options.auth.trim().split('/');
    const [groupName, functionName] = propertyPath;
    if (existsSync(filePath)) {
        try {
            const credentials = JSON.parse(readFileSync(filePath).toString('utf-8'));
            const group = credentials[groupName];
            return (group && group[functionName]) || {};
        }
        catch (error) {
            Console.error(error);
        }
    }
    Console.error(`Invalid credentials: ${groupName}/${functionName}. Check if credentials.json exists and is a valid JSON file.`);
}
async function runFunction(options, params, input = process.stdin, output = process.stdout) {
    const credentials = options.auth ? await readCredentials(options, params) : null;
    const url = buildFunctionUrl(options, params);
    const stdin = options.stdin ? createReadStream(join(CWD$1, options.stdin)) : input;
    const onResponse = (response) => {
        const nextHeader = response.headers['x-next'];
        const next = nextHeader !== undefined ? parseArgs(nextHeader) : false;
        if (next) {
            runFunction(options, next, input, output);
            return;
        }
        if (response.statusCode !== 200) {
            output.write(response.statusCode + ' ' + response.statusMessage + '\n');
            response.pipe(process.stderr);
            process.exit(1);
        }
        response.pipe(output);
    };
    const requestOptions = { ...baseRequestOptions };
    if (credentials) {
        const token = Buffer.from(JSON.stringify(credentials), 'utf-8').toString('base64');
        requestOptions.headers.authorization = 'Bearer ' + token;
    }
    if (options.debug) {
        Console.log(String(url), requestOptions);
    }
    const request$2 = (url.protocol === 'http:' ? request : request$1)(url, requestOptions, onResponse);
    request$2.on('error', (message) => Console.error(message));
    if (options.data) {
        request$2.write(options.data);
        request$2.end();
        return;
    }
    stdin.pipe(request$2);
}
function parseArgs(string) {
    return string.split(/\s+/);
}

const CWD = process.cwd();
async function serve(options) {
    const pathToIndex = join(CWD, "index.js");
    if (!existsSync(pathToIndex)) {
        Console.error("Cannot find index.js in " + CWD + ". Are you in the right folder?");
    }
    if (!existsSync(join(CWD, "node_modules", "@node-lambdas", "core"))) {
        Console.info("Installing @node-lambdas/core");
        execSync("npm i --no-save @node-lambdas/core");
    }
    const port = Number(options.port || process.env.PORT || DEFAULT_PORT);
    Console.info(`Starting server on ${port}`);
    return await import(pathToIndex);
}

resolve(dirname(decodeURI(new URL(import.meta.url).pathname)));
function main(cliArgs) {
    const { options, params } = parseOptionsAndParams(cliArgs);
    if (options.serve) {
        return serve(options);
    }
    if (options.info) {
        return printFunctionApi(options, params);
    }
    runFunction(options, params);
}

export { main, printFunctionApi, runFunction, serve };
