/**
 * Copyright 2026 Cisco Systems, Inc. and its affiliates
 * * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { decodeGeneric } from '@blackwell-systems/gcf';
import { formatToolResult } from '../src/response_format.js';

// decodeGeneric returns Map objects; convert to plain for comparison.
function demap(x: unknown): unknown {
  if (x instanceof Map) {
    const o: Record<string, unknown> = {};
    for (const [k, v] of x) o[String(k)] = demap(v);
    return o;
  }
  if (Array.isArray(x)) return x.map(demap);
  return x;
}

// A representative vManage /dataservice response: a data array of uniform records.
const VMANAGE_RESULT = {
  header: { generatedOn: 1786200000000 },
  data: [
    { 'system-ip': '10.10.1.1', 'host-name': 'vedge-1', reachability: 'reachable' },
    { 'system-ip': '10.10.1.2', 'host-name': 'vedge-2', reachability: 'reachable' },
  ],
};

function testDefaultIsJson(): void {
  delete process.env.RESPONSE_FORMAT;
  const out = formatToolResult(VMANAGE_RESULT);
  assert.deepEqual(JSON.parse(out), VMANAGE_RESULT);
}

function testGcfModeIsLossless(): void {
  process.env.RESPONSE_FORMAT = 'gcf';
  const wire = formatToolResult(VMANAGE_RESULT);
  assert.ok(wire.startsWith('GCF profile=generic'));
  assert.deepEqual(demap(decodeGeneric(wire)), VMANAGE_RESULT);
  delete process.env.RESPONSE_FORMAT;
}

testDefaultIsJson();
testGcfModeIsLossless();
console.log('response_format: all tests passed');
