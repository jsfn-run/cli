# @node-lambdas/cli

This CLI can be used to create, execute or develop new lambdas.

## Create

How to create a lambda project:

```bash
fn +create [name]

# create using another function as template
fn +create [name] from [existing-function]
```

## Serve

How to serve a lambda project with CLI:

```bash
cd path/to/project
fn +serve

# use a different port
fn +serve port=2000
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

You can [see the available functions](https://github.com/node-lambdas/node-lambdas) and read more in the index repository.

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
