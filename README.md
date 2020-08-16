# @node-lambdas/cli

This CLI can be used to create, execute or develop new lambdas.

## Creating a lambda

```bash
fn --create [name]
```

## Serving a lambda on localhost

```bash
cd path/to/project
fn --serve
```

## Running any public lambda

Calling `fn` with a function name will pipe `stdin` to a cloud function and pipe the output back to `stdout`.

```bash

echo -n 'input' | fn [name]
```

You can [see the available functions](https://github.com/node-lambdas/node-lambdas) and read more in the index repository.
