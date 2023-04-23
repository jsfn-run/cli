#!/usr/bin/env node

import { main } from './index.js';
import { Console } from '@node-lambdas/core';

async function run() {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    Console.error(String(error));
    process.exit(1);
  }
}

run();
