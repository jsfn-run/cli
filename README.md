# @node-lambdas/cli

This CLI can be used to create, execute or develop new lambdas.

## Create

How to create a lambda project:

```bash
fn --create [name]

# create using another function as template
fn --create [name] --from [existing-function]
```

## Serve

How to serve a lambda project with CLI:

```bash
cd path/to/project
fn --serve

# use a different port
fn --serve --port=2000
```

## Run

Running any publicly available lambda or run your new project on localhost

Calling `fn` with a function name will pipe `stdin` to a cloud function and pipe the output back to `stdout`.

```bash

echo -n 'input' | fn [name]

# pipe file.txt to a lambda running in your machine
cat file.txt | fn --local

# pipe file.txt to a lambda running in your machine that uses port 2000
cat file.txt | fn --local --port=2000
```

You can [see the available functions](https://github.com/node-lambdas/node-lambdas) and read more in the index repository.
