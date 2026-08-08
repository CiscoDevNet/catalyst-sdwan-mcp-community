/**
 * Copyright 2026 Cisco Systems, Inc. and its affiliates
 * * SPDX-License-Identifier: Apache-2.0
 */

import { encodeGeneric } from '@blackwell-systems/gcf';

/**
 * Serialize a tool result, honoring the RESPONSE_FORMAT environment variable.
 *
 * Default (`json`) returns pretty-printed JSON, unchanged. Setting
 * `RESPONSE_FORMAT=gcf` returns the same result encoded as a Graph Compact
 * Format generic wire, which factors the repeated field names of vManage
 * `{ data: [...] }` record collections into a single header and uses fewer
 * tokens when the response crosses the LLM boundary.
 *
 * The encoding is lossless (decoding the wire reproduces the result). If
 * encoding fails for any reason, the JSON serialization is returned so a
 * fetched result is never lost.
 */
export function formatToolResult(result: unknown): string {
  if (process.env.RESPONSE_FORMAT?.trim().toLowerCase() === 'gcf') {
    try {
      return encodeGeneric(result);
    } catch {
      // Fall back to JSON below.
    }
  }
  return JSON.stringify(result, null, 2);
}
