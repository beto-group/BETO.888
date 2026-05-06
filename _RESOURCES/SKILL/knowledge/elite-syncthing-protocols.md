---
name: elite-syncthing-protocols
description: Advanced REST API automation, SSH tunneling, and service management for Syncthing.
---

# Elite Syncthing Protocols

This segment details advanced management patterns for Syncthing in high-performance environments (Local and VPS).

## 1. REST API Automation (`curl`)
Syncthing is best managed via its REST API rather than the legacy CLI.

### Health Check (Ping)
```bash
curl -X GET -H "X-API-Key: YOUR_API_KEY" http://localhost:8384/rest/system/ping
```

### Triggering Rescan
```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:8384/rest/db/scan?folder=folder-id
```

## 2. Remote Server Management (SSH Tunneling)
When running Syncthing on a remote VPS (e.g., Contabo) without exposing port 8384 to the public internet:

### Establish Secure Tunnel
```bash
ssh -L 8384:localhost:8384 user@remote-vps-ip
```
After establishing this tunnel, access the Syncthing GUI at `http://localhost:8384`.

## 3. Service Lifecycle (Linux/systemd)
On Linux servers, Syncthing should run as a managed service.

### Control Commands
- **Check Status**: `systemctl --user status syncthing`
- **Start Service**: `systemctl --user start syncthing`
- **Enable on Boot**: `systemctl --user enable syncthing`

### Background Execution (Non-systemd)
If `systemd` is unavailable, use `screen` or `tmux`:
```bash
screen -S syncthing
syncthing
# Press Ctrl+A, then D to detach
```

### Sharing Management
To share a folder with a device, update the `devices` array in the folder configuration:
```bash
curl -X PUT -H "X-API-Key: YOUR_API_KEY" -H "Content-Type: application/json" \
  -d '{"id":"folder-id", "path":"...", "devices":[{"deviceID":"node-id"}]}' \
  http://localhost:8384/rest/config/folders
```

## 5. Security Protocols
- **API Key Rotation**: Regularly rotate API keys for VPS instances.
- **Firewall Isolation**: Ensure port 8384 is NOT bound to `0.0.0.0` on remote servers. Use `127.0.0.1` and SSH tunnels exclusively.
- **Read-Only Nodes**: For distribution-only VPS setups, set folder `type` to `sendonly` or `receiveonly`.
