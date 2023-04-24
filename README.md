# @node-lambdas/cli

This CLI can be used to run or test [cloud functions](https://github.com/node-lambdas) from a terminal.

A reusable cloud function is basically an HTTPS server:

```
input >> POST https://[service].jsfn.run/[function] >> output
```

For example: you have a JSON and you want to convert it to YAML, but you cannot install a program for that.

```bash
cat file.json | fn yaml encode | tee file.yml
```

## Can I use it with cURL?

Absolutely!

```bash
curl -d @file.json https://yaml.jsfn.run/encode
```


### Examples

```bash
# convert JSON to YAML
cat your.json | fn yaml

# calculate the sha256 hash for the content of file.txt
cat file.txt | fn sha 256

# convert Markdown to HTML
cat README.md | fn markdown

```

## Serve

How to serve a lambda project with CLI:

```bash
cd path/to/project
fn +serve

# use a different port
fn +serve +port=2000
```

## Run

Running any publicly available lambda or run your new project on localhost

Calling `fn` with a function name will pipe `stdin` to a cloud function and pipe the output back to `stdout`.

```bash

echo -n 'input' | fn [name]

# pipe file.txt to a lambda running in your machine
cat file.txt | fn +local

# pipe file.txt to a lambda running in your machine that uses port 2000
cat file.txt | fn +local +port=2000
```

You can [see the available functions](https://github.com/node-lambdas/discover) and read more in the index repository.

## Run without input pipe

Usually you would use the syntax `a | fn b` to pipe data into a function.
You can also add input options to `fn` instead, and bypass _stdin_.

Use `+data='input data'` to send the input data instead.
You can also read from a file, using the `+stdin=path/to/file`, or the shortcut, `@path/to/file`.

For example:

```bash
fn data='hello' | fn base64
fn @input.txt | fn sha 512
fn +stdin=image.png | fn resize 1024x768

```

## API Authentication

Some functions need credentials in order to run API calls.
These credentials can be stored in a file called `credentials.json`.

The format is as follows:

- the top level keys are **authentication groups**. You use this name with `+auth`.
- each key under a group is a **function name**
- each key under a function maps to an **HTTP header** that the function needs.

For example: let's say you want to call the same function with different credentials:

```json
{
  "default" {
    "function-name": {
      "access-key-id": "key-123",
      "access-key": "cac54b35c4ab6a5c46abb"
    },
    "another-name": {
      "authentication": "bearer cac54b35c4ab6a5c46abb"
    },
  },
  "bob-credentials": {
    "function-name": {
      "access-key-id": "key-456",
      "access-key": "4524bc45ba54ba45b25c2"
    },
  },
}
```

You can invoke the same function passing the authentication group to use:

```bash
# Using default credentials
echo 'let me in' | fn +auth function-name

# Using both default and 'bob-credentials' to pipe from one function call to another. The third call will not use any credentials
echo 'let me in' | fn +auth function-name | fn +auth=bob-credentials function-name | fn another-name
```

## All options

| option           | description                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `+auth=[name]`   | Name of an authentication group to use from './credentials.json'         |
| `+serve`         | Serve a function from current folder for local testing                   |
| `+port=[number]` | The http port to use when calling a local server with a running function |
| `+data=[data]`   | Use the data passed as argument instead of `stdin` for next step         |
| `+info name`     | Shows more details about a cloud function                                |
| `+json`          | Show cloud function API as JSON                                          |
