# Expo Dev Server in Docker/DevContainer - Network Access

When running Expo in a VS Code devcontainer, the **QR code shows the container’s IP address**, so Expo Go on your device can’t connect (your phone can’t reach the container). Use one of the approaches below.

## Recommended: Use Tunnel Mode (no port forwarding)

**Use this so the QR code points to a public URL instead of the container IP.**

From the repo root or `apps/mobile`:

```bash
npm run dev -- --filter=@agora/mobile
# or
cd apps/mobile && npm run dev
```

This starts Expo with `--tunnel`. The QR code will use a tunnel URL (e.g. `exp://u.expo.dev/...`) that works from your phone regardless of Docker/port forwarding. No login required for anonymous mode.

If you run Expo another way (e.g. “Start” from the Expo VS Code extension), make sure it uses tunnel: pass `--tunnel` or choose “tunnel” when prompted.

## Alternative: LAN mode with host IP (REACT_NATIVE_PACKAGER_HOSTNAME)

If you need LAN mode (e.g. tunnel is blocked), the dev server must advertise your **host machine’s LAN IP** in the QR code, not the container’s.

1. **Get your host LAN IP**

   - VS Code: Ports panel → check the address shown for port 8081.
   - Or on the host: `ip addr` / `ifconfig` / `ipconfig` and use the host’s LAN IP (e.g. `192.168.1.100`).

2. **Set it when starting Expo** (from `apps/mobile`):

   ```bash
   export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.100   # use your host IP
   npm run dev:lan
   ```

   Or use a `.env` file in `apps/mobile` (see `.env.example`):

   ```bash
   # apps/mobile/.env
   REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.100
   ```

   Then run `npm run dev:lan` (the script loads `.env` so the QR code uses this hostname).

3. **Port forwarding**  
   Port `8081` must still be forwarded from the container to the host (devcontainer already forwards it). Ensure the port is “Public” or listening on all interfaces in the VS Code Ports panel so your phone can reach `YOUR_HOST_IP:8081`.

## Current Setup

- **Metro bundler** binds to `0.0.0.0:8081` inside the container (with `--lan`)
- **Port forwarding** for `8081` is configured in `devcontainer.json`
- **VS Code** `remote.localPortHost: "allInterfaces"` makes forwarded ports reachable from the LAN (reload the window if you change it)

## If Port Forwarding Still Doesn't Work

### Option 1: Reload VS Code Window

The `remote.localPortHost` setting requires VS Code to reload:

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Run: **"Developer: Reload Window"**
3. Restart Expo dev server: `npm run dev -- --filter=@agora/mobile`

### Option 2: Manual VS Code Port Forwarding

1. In VS Code, open the **Ports** panel (bottom panel, or `Cmd/Ctrl+Shift+P` → "Ports: Focus on Ports View")
2. Find port `8081` in the list
3. Right-click → **"Change Port Visibility"** → Select **"Public"** or **"Private"**
4. Right-click → **"Port Attributes"** → Ensure it's set to listen on all interfaces

### Option 3: Use Docker Port Mapping Directly

If VS Code forwarding still doesn't work, you can manually expose the port via Docker:

```bash
# Find your container ID
docker ps | grep devcontainer

# Expose port 8081 to host (replace CONTAINER_ID)
docker port CONTAINER_ID 8081
# Or add port mapping when container is running (requires container restart)
```

### Option 4: Use Host Network Mode (Advanced)

Modify `.devcontainer/devcontainer.json` to use host network:

```json
{
  "runArgs": ["--network=host"]
}
```

**Warning:** This makes the container use the host's network stack directly, which can cause port conflicts.

## Verify Metro is Listening

Inside the container, verify Metro is bound to all interfaces:

```bash
netstat -tlnp | grep 8081
# Should show: tcp6 0 0 :::8081 :::* LISTEN
```

If it shows `127.0.0.1:8081` instead, Metro is only listening on localhost and won't accept forwarded connections.

## Testing

After applying fixes:

1. **From host machine browser:** `http://localhost:8081/status` should return `packager-status:running`
2. **From Android device:** `http://YOUR_HOST_IP:8081/status` should also work (replace `YOUR_HOST_IP` with your machine's LAN IP - check VS Code Ports panel)
