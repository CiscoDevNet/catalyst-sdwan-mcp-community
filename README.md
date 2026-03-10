# Cisco Catalyst SD-WAN MCP Server

Model Context Protocol (MCP) server for **Cisco Catalyst SD-WAN Manager (vManage)**. It exposes vManage REST API capabilities as MCP tools, allowing AI assistants to query and manage SD-WAN fabric through vManage. **SD-WAN routers are accessed only via vManage**—no direct router communication.

## Features

- **39 MCP tools** covering device management, real-time monitoring, templates, policies, CloudExpress, and administration
- **Dual authentication**: JWT (recommended for vManage 20.18.1+) and session-based (JSESSIONID) fallback
- **Docker support** for containerized deployment
- **HTTPS on port 443** by default for vManage communication

## Prerequisites

- Node.js 18+
- Access to a Cisco Catalyst SD-WAN Manager (vManage) instance
- vManage credentials with appropriate API permissions

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VMANAGE_HOST` | Yes | - | vManage hostname or IP address |
| `VMANAGE_USERNAME` | Yes | - | vManage username |
| `VMANAGE_PASSWORD` | Yes | - | vManage password |
| `VMANAGE_PORT` | No | 443 | vManage HTTPS port |
| `VMANAGE_USE_JWT` | No | true | Use JWT auth (set false for session-based) |

### Cursor MCP Configuration

Add to your Cursor MCP settings (e.g. `~/.cursor/mcp.json` or project `.cursor/mcp.json`):

**Using Docker:**
```json
{
  "mcpServers": {
    "catalyst-sdwan": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "VMANAGE_HOST=your-vmanage.example.com",
        "-e", "VMANAGE_PORT=443",
        "-e", "VMANAGE_USERNAME=admin",
        "-e", "VMANAGE_PASSWORD=your_password",
        "catalyst-sdwan-mcp:latest"
      ]
    }
  }
}
```

**Using Node.js directly:**
```json
{
  "mcpServers": {
    "catalyst-sdwan": {
      "command": "node",
      "args": ["/path/to/catalyst-sdwan-mcp/build/index.js"],
      "env": {
        "VMANAGE_HOST": "your-vmanage.example.com",
        "VMANAGE_PORT": "443",
        "VMANAGE_USERNAME": "admin",
        "VMANAGE_PASSWORD": "your_password"
      }
    }
  }
}
```

## Docker

### Build
```bash
cd catalyst-sdwan-mcp
docker build -t catalyst-sdwan-mcp:latest .
```

### Run with docker-compose
```bash
# Create .env from .env.example and set credentials
cp .env.example .env
# Edit .env with your vManage details

docker-compose up -d
```

### Run standalone
```bash
docker run -i --rm \
  -e VMANAGE_HOST=10.1.1.1 \
  -e VMANAGE_PORT=443 \
  -e VMANAGE_USERNAME=admin \
  -e VMANAGE_PASSWORD=secret \
  catalyst-sdwan-mcp:latest
```

## Available Tools (39)

### Device Management
- `list_devices` - List all devices in the fabric
- `get_device_details` - Get details for a specific device
- `list_reachable_devices` - List reachable devices
- `list_controllers` - List vManage, vSmart, vBond controllers

### Real-time Monitoring (Control & OMP)
- `get_control_connections` - Control plane connections
- `get_control_summary` - Control plane summary
- `get_control_statistics` - DTLS statistics
- `get_omp_peers` - OMP peers
- `get_omp_routes` - OMP routes
- `get_omp_summary` - OMP summary

### Real-time Monitoring (BFD, BGP, Interfaces)
- `get_bfd_sessions` - BFD sessions
- `get_bfd_summary` - BFD summary
- `get_bfd_tloc` - BFD per TLOC
- `get_bgp_neighbors` - BGP neighbors
- `get_bgp_routes` - BGP routes
- `get_bgp_summary` - BGP summary
- `get_device_interfaces` - Interface status
- `get_system_status` - System status (CPU, memory)
- `get_device_arp` - ARP table

### Application Routing & Cflowd
- `get_app_route_statistics` - App-route tunnel stats
- `get_app_route_sla_class` - SLA class info
- `get_cflowd_flows` - Cflowd flows
- `get_cflowd_statistics` - Cflowd stats
- `get_app_log_flows` - Packet flow logs
- `get_app_log_flow_count` - Flow count
- `get_sdwan_stats` - SD-WAN statistics

### Templates
- `list_device_templates` - Device templates
- `list_feature_templates` - Feature templates
- `get_attached_devices` - Devices attached to template
- `get_template_definition` - Template configuration

### Policy
- `list_policy_lists` - Policy lists
- `list_policy_definitions` - Policy definitions
- `list_policies` - Configured policies

### CloudExpress / Cloud OnRamp
- `get_cloudx_status` - CloudExpress status
- `get_cloudx_gateway_list` - Gateway list
- `get_cloudx_client_list` - Client/site list
- `get_cloudx_apps` - Apps and VPNs

### Administration
- `list_alarms` - Active alarms
- `get_certificate_summary` - Certificate validity
- `list_vedge_inventory` - vEdge inventory
- `get_cluster_status` - Cluster status

### Other
- `list_custom_apps` - Custom applications
- `get_device_vpn` - VPN configuration
- `get_device_tloc` - TLOC information
- `get_bridge_table` - Bridge forwarding table

## Authentication

The server supports two authentication methods per [Cisco Catalyst SD-WAN Manager API docs](https://developer.cisco.com/docs/sdwan/authentication/):

1. **JWT (recommended)** - For vManage 20.18.1+. Single login returns access token and XSRF token. Set `VMANAGE_USE_JWT=true` (default).

2. **Session-based** - Legacy method. POST to `/j_security_check` for JSESSIONID, then GET `/dataservice/client/token` for XSRF. Set `VMANAGE_USE_JWT=false`.

All API requests use HTTPS. Self-signed certificates (common in lab environments) are accepted; for production, use properly signed certificates.

## API Reference

- [Cisco Catalyst SD-WAN Manager API Overview](https://developer.cisco.com/docs/sdwan/overview/)
- [Authentication](https://developer.cisco.com/docs/sdwan/authentication/)
- [Device Realtime Monitoring](https://developer.cisco.com/docs/sdwan/device-realtime-monitoring/)

## License

MIT
