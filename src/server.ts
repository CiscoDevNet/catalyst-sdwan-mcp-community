/*
 * MIT License
 * Cisco Catalyst SD-WAN MCP Server
 * Exposes vManage API capabilities as MCP tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { VManageApiService } from './services/vmanageApi.js';
import { loadConfig } from './utils/config.js';

export class CatalystSdwanMCPServer {
  private server: Server;
  private apiService: VManageApiService;

  constructor() {
    const config = loadConfig();
    this.apiService = new VManageApiService(config);

    this.server = new Server(
      {
        name: 'catalyst-sdwan-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: { listChanged: false },
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getAllTools(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        const result = await this.handleToolCall(name, args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    });
  }

  private getAllTools(): Tool[] {
    return [
      // === Device Management ===
      {
        name: 'list_devices',
        description: 'List all devices in the SD-WAN fabric (vEdges, vSmarts, vBonds, vManage). Returns hostname, system-ip, device-type, status, site-id, version.',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string', description: 'Filter by device model (e.g., vedge-cloud)' },
          },
        },
      },
      {
        name: 'get_device_details',
        description: 'Get detailed information for a specific device by device ID or system IP.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID (UUID) or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'list_reachable_devices',
        description: 'List devices that are currently reachable in the SD-WAN fabric.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'list_controllers',
        description: 'List vManage, vSmart, and vBond controllers in the fabric.',
        inputSchema: { type: 'object', properties: {} },
      },

      // === Real-time Monitoring - Control Plane ===
      {
        name: 'get_control_connections',
        description: 'Get control plane connection status for a device. Shows connections to vSmart/vBond.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_control_summary',
        description: 'Get control plane summary (device count) for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_control_statistics',
        description: 'Get control plane DTLS connection statistics for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === Real-time Monitoring - OMP ===
      {
        name: 'get_omp_peers',
        description: 'Get OMP (Overlay Management Protocol) peers for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_omp_routes',
        description: 'Get OMP routes advertised/received by a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_omp_summary',
        description: 'Get OMP summary for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === Real-time Monitoring - BFD ===
      {
        name: 'get_bfd_sessions',
        description: 'Get BFD (Bidirectional Forwarding Detection) sessions for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_bfd_summary',
        description: 'Get BFD session summary for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_bfd_tloc',
        description: 'Get BFD session summary per TLOC for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === Real-time Monitoring - Interfaces & System ===
      {
        name: 'get_device_interfaces',
        description: 'Get interface status and configuration for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_system_status',
        description: 'Get system status (CPU, memory, uptime) for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_device_arp',
        description: 'Get ARP table (IPv4 to MAC mappings) for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === Real-time Monitoring - Application Routing ===
      {
        name: 'get_app_route_statistics',
        description: 'Get application-aware routing statistics (tunnel stats) for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_app_route_sla_class',
        description: 'Get SLA class information for application-aware routing on a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === Real-time Monitoring - BGP ===
      {
        name: 'get_bgp_neighbors',
        description: 'Get BGP neighbors for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_bgp_routes',
        description: 'Get BGP routes for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_bgp_summary',
        description: 'Get BGP summary for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === Real-time Monitoring - Cflowd ===
      {
        name: 'get_cflowd_flows',
        description: 'Get cflowd flow information for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_cflowd_statistics',
        description: 'Get cflowd packet statistics for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === Real-time Monitoring - App Logs ===
      {
        name: 'get_app_log_flows',
        description: 'Get packet flow logging information for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
      {
        name: 'get_app_log_flow_count',
        description: 'Get count of packet flows being logged for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === SD-WAN Statistics ===
      {
        name: 'get_sdwan_stats',
        description: 'Get SD-WAN statistics (ACL drops, data policy, device metrics) for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === Templates ===
      {
        name: 'list_device_templates',
        description: 'List all device templates (master templates) in vManage.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'list_feature_templates',
        description: 'List all feature templates in vManage.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_attached_devices',
        description: 'Get devices attached to a specific device template.',
        inputSchema: {
          type: 'object',
          properties: {
            template_id: { type: 'string', description: 'Template ID' },
          },
          required: ['template_id'],
        },
      },
      {
        name: 'get_template_definition',
        description: 'Get the definition/configuration of a device or feature template.',
        inputSchema: {
          type: 'object',
          properties: {
            template_id: { type: 'string', description: 'Template ID' },
            template_type: {
              type: 'string',
              enum: ['device', 'feature'],
              description: 'Type of template',
            },
          },
          required: ['template_id', 'template_type'],
        },
      },

      // === Policy ===
      {
        name: 'list_policy_lists',
        description: 'List policy lists (app, aspath, color, community, data-prefix, etc.).',
        inputSchema: {
          type: 'object',
          properties: {
            list_type: {
              type: 'string',
              description: 'Filter by list type: app, aspath, color, community, dataipv6prefix, dataipv4prefix, policer, prefix, site, slaclass, tloc, vpn, etc.',
            },
          },
        },
      },
      {
        name: 'list_policy_definitions',
        description: 'List policy definitions (ACL, app-route, data, control, etc.).',
        inputSchema: {
          type: 'object',
          properties: {
            definition_type: {
              type: 'string',
              description: 'Filter by definition type: acl, approute, data, control, etc.',
            },
          },
        },
      },
      {
        name: 'list_policies',
        description: 'List configured policies (security, vedge, vsmart, voice assemblies).',
        inputSchema: { type: 'object', properties: {} },
      },

      // === CloudExpress / Cloud OnRamp ===
      {
        name: 'get_cloudx_status',
        description: 'Get CloudExpress (Cloud OnRamp) status - sites per application.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_cloudx_gateway_list',
        description: 'Get CloudExpress gateway list.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_cloudx_client_list',
        description: 'Get CloudExpress client/site list.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_cloudx_apps',
        description: 'Get CloudExpress apps and VPNs configuration.',
        inputSchema: { type: 'object', properties: {} },
      },

      // === Administration ===
      {
        name: 'list_alarms',
        description: 'List active alarms from vManage.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max number of alarms to return (default 100)' },
          },
        },
      },
      {
        name: 'get_certificate_summary',
        description: 'Get certificate validity summary for devices.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'list_vedge_inventory',
        description: 'List vEdge device inventory with sync status.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_cluster_status',
        description: 'Get vManage cluster status (if clustered).',
        inputSchema: { type: 'object', properties: {} },
      },

      // === Custom Applications ===
      {
        name: 'list_custom_apps',
        description: 'List custom application definitions.',
        inputSchema: { type: 'object', properties: {} },
      },

      // === VPN ===
      {
        name: 'get_device_vpn',
        description: 'Get VPN configuration for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === TLOC ===
      {
        name: 'get_device_tloc',
        description: 'Get TLOC (Transport Locator) information for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },

      // === Bridge ===
      {
        name: 'get_bridge_table',
        description: 'Get bridge forwarding table for a device.',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: { type: 'string', description: 'Device ID or system-ip' },
          },
          required: ['device_id'],
        },
      },
    ];
  }

  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
    const deviceId = args.device_id as string | undefined;
    const addDeviceId = (path: string) =>
      deviceId ? `${path}?deviceId=${encodeURIComponent(deviceId)}` : path;

    switch (name) {
      case 'list_devices': {
        const params = args.model ? { model: args.model as string } : undefined;
        return this.apiService.get('/dataservice/device', params);
      }
      case 'get_device_details': {
        if (!deviceId) throw new Error('device_id is required');
        const devices = await this.apiService.get<{ data?: Array<{ uuid?: string; 'system-ip'?: string }> }>('/dataservice/device');
        const found = (devices.data || []).find(
          (d) => d.uuid === deviceId || d['system-ip'] === deviceId
        );
        return found ?? { error: 'Device not found', device_id: deviceId };
      }
      case 'list_reachable_devices':
        return this.apiService.get('/dataservice/device/reachable');
      case 'list_controllers':
        return this.apiService.get('/dataservice/system/device/controllers');

      case 'get_control_connections':
        return this.apiService.get(addDeviceId('/dataservice/device/control/connections'));
      case 'get_control_summary':
        return this.apiService.get(addDeviceId('/dataservice/device/control/summary'));
      case 'get_control_statistics':
        return this.apiService.get(addDeviceId('/dataservice/device/control/statistics'));

      case 'get_omp_peers':
        return this.apiService.get(addDeviceId('/dataservice/device/omp/peers'));
      case 'get_omp_routes':
        return this.apiService.get(addDeviceId('/dataservice/device/omp/routes'));
      case 'get_omp_summary':
        return this.apiService.get(addDeviceId('/dataservice/device/omp/summary'));

      case 'get_bfd_sessions':
        return this.apiService.get(addDeviceId('/dataservice/device/bfd/sessions'));
      case 'get_bfd_summary':
        return this.apiService.get(addDeviceId('/dataservice/device/bfd/summary'));
      case 'get_bfd_tloc':
        return this.apiService.get(addDeviceId('/dataservice/device/bfd/tloc'));

      case 'get_device_interfaces':
        return this.apiService.get(addDeviceId('/dataservice/device/interface'));
      case 'get_system_status':
        return this.apiService.get(addDeviceId('/dataservice/device/system/status'));
      case 'get_device_arp':
        return this.apiService.get(addDeviceId('/dataservice/device/arp'));

      case 'get_app_route_statistics':
        return this.apiService.get(addDeviceId('/dataservice/device/app-route/statistics'));
      case 'get_app_route_sla_class':
        return this.apiService.get(addDeviceId('/dataservice/device/app-route/sla-class'));

      case 'get_bgp_neighbors':
        return this.apiService.get(addDeviceId('/dataservice/device/bgp/neighbors'));
      case 'get_bgp_routes':
        return this.apiService.get(addDeviceId('/dataservice/device/bgp/routes'));
      case 'get_bgp_summary':
        return this.apiService.get(addDeviceId('/dataservice/device/bgp/summary'));

      case 'get_cflowd_flows':
        return this.apiService.get(addDeviceId('/dataservice/device/cflowd/flows'));
      case 'get_cflowd_statistics':
        return this.apiService.get(addDeviceId('/dataservice/device/cflowd/statistics'));

      case 'get_app_log_flows':
        return this.apiService.get(addDeviceId('/dataservice/device/app/log/flows'));
      case 'get_app_log_flow_count':
        return this.apiService.get(addDeviceId('/dataservice/device/app/log/flow-count'));

      case 'get_sdwan_stats':
        return this.apiService.get(addDeviceId('/dataservice/device/sdwan-stats'));

      case 'list_device_templates':
        return this.apiService.get('/dataservice/template/device');
      case 'list_feature_templates':
        return this.apiService.get('/dataservice/template/feature');
      case 'get_attached_devices': {
        const templateId = args.template_id as string;
        if (!templateId) throw new Error('template_id is required');
        return this.apiService.get(
          `/dataservice/template/device/config/attached/${encodeURIComponent(templateId)}`
        );
      }
      case 'get_template_definition': {
        const templateId = args.template_id as string;
        const templateType = args.template_type as string;
        if (!templateId || !templateType) throw new Error('template_id and template_type required');
        const path =
          templateType === 'device'
            ? `/dataservice/template/device/object/${encodeURIComponent(templateId)}`
            : `/dataservice/template/feature/object/${encodeURIComponent(templateId)}`;
        return this.apiService.get(path);
      }

      case 'list_policy_lists': {
        const listType = args.list_type as string | undefined;
        const path = listType
          ? `/dataservice/template/policy/list/${encodeURIComponent(listType)}`
          : '/dataservice/template/policy/list';
        return this.apiService.get(path);
      }
      case 'list_policy_definitions': {
        const defType = args.definition_type as string | undefined;
        const path = defType
          ? `/dataservice/template/policy/definition/${encodeURIComponent(defType)}`
          : '/dataservice/template/policy/definition';
        return this.apiService.get(path);
      }
      case 'list_policies':
        return this.apiService.get('/dataservice/template/policy');

      case 'get_cloudx_status':
        return this.apiService.get('/dataservice/template/cloudx');
      case 'get_cloudx_gateway_list':
        return this.apiService.get('/dataservice/template/cloudx/gatewaylist');
      case 'get_cloudx_client_list':
        return this.apiService.get('/dataservice/template/cloudx/clientlist');
      case 'get_cloudx_apps':
        return this.apiService.get('/dataservice/template/cloudx/manage/apps');

      case 'list_alarms': {
        const limit = (args.limit as number) || 100;
        return this.apiService.get(`/dataservice/alarms?limit=${limit}`);
      }
      case 'get_certificate_summary':
        return this.apiService.get('/dataservice/certificate/stats/summary');
      case 'list_vedge_inventory':
        return this.apiService.get('/dataservice/device/vedgeinventory');
      case 'get_cluster_status':
        return this.apiService.get('/dataservice/clusterManagement/clusterStatus');

      case 'list_custom_apps':
        return this.apiService.get('/dataservice/template/policy/customapp');

      case 'get_device_vpn':
        return this.apiService.get(addDeviceId('/dataservice/device/vpn'));
      case 'get_device_tloc':
        return this.apiService.get(addDeviceId('/dataservice/device/tloc'));
      case 'get_bridge_table':
        return this.apiService.get(addDeviceId('/dataservice/device/bridge/table'));

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Cisco Catalyst SD-WAN MCP Server running on stdio');
  }
}
