/*
 * MIT License
 * Configuration utilities for Catalyst SD-WAN MCP Server
 */

export interface VManageConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  useJwt: boolean;
}

export function loadConfig(): VManageConfig {
  const host = process.env.VMANAGE_HOST;
  const username = process.env.VMANAGE_USERNAME;
  const password = process.env.VMANAGE_PASSWORD;

  if (!host) {
    throw new Error('VMANAGE_HOST environment variable is required');
  }
  if (!username) {
    throw new Error('VMANAGE_USERNAME environment variable is required');
  }
  if (!password) {
    throw new Error('VMANAGE_PASSWORD environment variable is required');
  }

  const port = parseInt(process.env.VMANAGE_PORT || '443', 10);
  const useJwt = process.env.VMANAGE_USE_JWT !== 'false';

  return {
    host,
    port,
    username,
    password,
    useJwt,
  };
}
