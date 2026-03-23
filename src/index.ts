/**
 * Copyright 2026 Cisco Systems, Inc. and its affiliates
 * * SPDX-License-Identifier: Apache-2.0
 */

#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/*
 * MIT License
 * Cisco Catalyst SD-WAN MCP Server
 * Communicates with vManage via REST API. SD-WAN routers are queried through vManage only.
 */

import { CatalystSdwanMCPServer } from './server.js';

async function main() {
  const server = new CatalystSdwanMCPServer();
  await server.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
