# Agora Mobile App

React Native mobile app built with Expo Router.

## Development

### Prerequisites

- Node.js 22+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI for builds (`npm install -g eas-cli`)
- Android device or emulator for testing

### Running Locally

#### Option 1: Tunnel Mode (Recommended - Works Everywhere)

```bash
cd apps/mobile
npm run dev
```

This starts Expo in tunnel mode, which works even if your device is on a different network. No login required for anonymous mode.

- **Expo dev server**: Uses Expo's tunnel (works from any network)
- **API server**: Must be configured in `app.json` extra.apiUrl (see below)

#### Option 2: LAN Mode (Faster, but May Require Login)

```bash
cd apps/mobile
npm run dev:lan
```

**Note**: LAN mode may prompt for Expo login in non-interactive terminals. To avoid this:

- Use tunnel mode (`npm run dev`) instead, or
- Login once: `npx expo login` (then LAN mode won't prompt)

This starts Expo in LAN mode, which auto-detects your machine's IP address:

- **Expo dev server**: Your machine's LAN IP (auto-detected)
- **API server**: Must be configured in `app.json` extra.apiUrl (see below)

**To set API URL for device access:**

1. Find your machine's LAN IP:

   - **VS Code**: Check the Ports panel - it shows the forwarded address
   - **macOS/Linux**: Run `ifconfig` or `ip addr` and look for your network interface
   - **Windows**: Run `ipconfig` and look for IPv4 Address

2. Add to `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_LAN_IP:3001/api"
    }
  }
}
```

### Configuration

#### API URL

The app needs to know where to find the API server. Configure it in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-api-domain.com/api"
    }
  }
}
```

3. **Default fallback**: `http://localhost:3001/api` (only works for web)

### Building for Production

See [DEVELOPMENT_BUILD.md](./DEVELOPMENT_BUILD.md) for instructions on creating development builds with push notifications.

### Troubleshooting

#### QR code points to wrong URL (e.g. in devcontainer)

When running inside a **Docker/devcontainer**, the QR code may show the container’s IP, so Expo Go on your device can’t connect.

- **Use tunnel mode**: Run `npm run dev` (default) so the QR code uses a tunnel URL. See [docs/EXPO_DOCKER_NETWORKING.md](../../docs/EXPO_DOCKER_NETWORKING.md).
- **Or use LAN with host IP**: Set `REACT_NATIVE_PACKAGER_HOSTNAME` to your host machine’s LAN IP (e.g. in `apps/mobile/.env`), then run `npm run dev:lan`.

#### Device Can't Connect to Dev Server

1. **Use tunnel mode**: `npm run dev` (uses tunnel mode by default)
2. **Check VS Code Ports panel**: Make sure port 8081 is forwarded and accessible (for LAN mode)
3. **Check firewall**: Ensure ports 8081 and 3001 are not blocked

#### Device Can't Connect to API

1. **Configure API URL**: Set `app.json` extra.apiUrl with your LAN IP (see Configuration section)
2. **Check API server**: Make sure the API is running and bound to `0.0.0.0` (not just `localhost`)
3. **Use tunnel mode**: Tunnel mode works for Expo dev server, but API still needs LAN IP configured

#### Finding Your LAN IP

- **VS Code**: Check the Ports panel - it shows the forwarded address
- **macOS/Linux**: Run `ifconfig` or `ip addr` and look for your network interface
- **Windows**: Run `ipconfig` and look for IPv4 Address
