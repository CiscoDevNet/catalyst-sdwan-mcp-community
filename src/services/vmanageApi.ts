/*
 * MIT License
 * Cisco Catalyst SD-WAN Manager (vManage) API Client
 * Supports JWT (20.18.1+) and session-based authentication
 * Docs: https://developer.cisco.com/docs/sdwan/overview/
 */

import https from 'https';
import fetch from 'node-fetch';
import type { VManageConfig } from '../utils/config.js';

const HTTPS_AGENT = new https.Agent({ rejectUnauthorized: false });

interface JwtLoginResponse {
  token?: string;
  refresh?: string;
  csrf?: string;
  exp?: number;
}

export class VManageApiService {
  private config: VManageConfig;
  private baseUrl: string;
  private jwtToken: string | null = null;
  private xsrfToken: string | null = null;
  private jsessionId: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: VManageConfig) {
    this.config = config;
    this.baseUrl = `https://${config.host}:${config.port}`;
  }

  private async ensureAuthenticated(): Promise<void> {
    const now = Date.now() / 1000;
    if (this.config.useJwt) {
      if (this.jwtToken && this.tokenExpiry > now + 60) {
        return;
      }
      await this.authenticateJwt();
    } else {
      if (!this.jsessionId) {
        await this.authenticateSession();
      }
    }
  }

  private async authenticateJwt(): Promise<void> {
    const url = `${this.baseUrl}/jwt/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
        duration: 3600,
      }),
      agent: HTTPS_AGENT,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`JWT authentication failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as JwtLoginResponse;
    if (!data.token) {
      throw new Error('JWT login response missing token');
    }

    this.jwtToken = data.token;
    this.xsrfToken = data.csrf || null;
    this.tokenExpiry = data.exp || Math.floor(Date.now() / 1000) + 1800;
  }

  private async authenticateSession(): Promise<void> {
    const url = `${this.baseUrl}/j_security_check`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        j_username: this.config.username,
        j_password: this.config.password,
      }),
      redirect: 'manual',
      agent: HTTPS_AGENT,
    });

    const setCookie = response.headers.get('set-cookie');
    if (!setCookie || !setCookie.includes('JSESSIONID')) {
      const text = await response.text();
      if (text.includes('<html') || text.includes('login')) {
        throw new Error('Session authentication failed: invalid credentials');
      }
      throw new Error(`Session authentication failed: ${response.status}`);
    }

    const match = setCookie.match(/JSESSIONID=([^;]+)/);
    if (!match) {
      throw new Error('Failed to extract JSESSIONID from response');
    }
    this.jsessionId = `JSESSIONID=${match[1]}`;

    const tokenUrl = `${this.baseUrl}/dataservice/client/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: this.jsessionId,
      },
      agent: HTTPS_AGENT,
    });

    if (tokenResponse.ok) {
      this.xsrfToken = (await tokenResponse.text()).replace(/"/g, '');
    }
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    await this.ensureAuthenticated();

    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
      if (this.xsrfToken) {
        headers['X-XSRF-TOKEN'] = this.xsrfToken;
      }
    } else if (this.jsessionId) {
      headers['Cookie'] = this.jsessionId;
      if (this.xsrfToken) {
        headers['X-XSRF-TOKEN'] = this.xsrfToken;
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      agent: HTTPS_AGENT,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`vManage API error ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
  }

  async post<T = unknown>(path: string, body?: object): Promise<T> {
    await this.ensureAuthenticated();

    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
      if (this.xsrfToken) {
        headers['X-XSRF-TOKEN'] = this.xsrfToken;
      }
    } else if (this.jsessionId) {
      headers['Cookie'] = this.jsessionId;
      if (this.xsrfToken) {
        headers['X-XSRF-TOKEN'] = this.xsrfToken;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      agent: HTTPS_AGENT,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`vManage API error ${response.status}: ${text}`);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  async put<T = unknown>(path: string, body?: object): Promise<T> {
    await this.ensureAuthenticated();

    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
      if (this.xsrfToken) {
        headers['X-XSRF-TOKEN'] = this.xsrfToken;
      }
    } else if (this.jsessionId) {
      headers['Cookie'] = this.jsessionId;
      if (this.xsrfToken) {
        headers['X-XSRF-TOKEN'] = this.xsrfToken;
      }
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      agent: HTTPS_AGENT,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`vManage API error ${response.status}: ${text}`);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  async delete(path: string): Promise<unknown> {
    await this.ensureAuthenticated();

    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
      if (this.xsrfToken) {
        headers['X-XSRF-TOKEN'] = this.xsrfToken;
      }
    } else if (this.jsessionId) {
      headers['Cookie'] = this.jsessionId;
      if (this.xsrfToken) {
        headers['X-XSRF-TOKEN'] = this.xsrfToken;
      }
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      agent: HTTPS_AGENT,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`vManage API error ${response.status}: ${text}`);
    }

    const text = await response.text();
    if (!text) return {};
    return JSON.parse(text);
  }
}
