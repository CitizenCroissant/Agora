# Dev Container Setup

This directory contains the configuration for using Visual Studio Code's Dev Containers feature with the Agora project.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [Visual Studio Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## Getting Started

1. Open the project in VS Code
2. When prompted, click "Reopen in Container" (or press `F1` and select "Dev Containers: Reopen in Container")
3. Wait for the container to build and dependencies to install
4. The shared package will be automatically built after container creation

## What's Included

- **Node.js 22** - Latest LTS version
- **npm 10.0.0** - Package manager
- **Git** - Version control
- **GitHub CLI** - For GitHub operations

## VS Code Extensions

The following extensions are automatically installed:

- ESLint
- Prettier
- TypeScript
- Expo Tools (for mobile development)
- Jest & Vitest support

## Port Forwarding

The following ports are automatically forwarded:

- **3000** - Web app (Next.js)
- **3001** - API server
- **8081** - Expo dev server (mobile)

## Environment Variables

You'll need to create `.env.local` files in the respective app directories:

- `apps/api/.env.local` - Supabase credentials for API
- `apps/ingestion/.env.local` - Supabase credentials for ingestion
- `apps/web/.env.local` - API URL configuration

See the `env.example` files in each app directory for required variables.

## Common Commands

Once the container is running:

```bash
# Start all dev servers
npm run dev

# Start specific apps
npm run dev -- --filter=api
npm run dev -- --filter=web
npm run dev -- --filter=mobile

# Build everything
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Troubleshooting

### Container won't start
- Ensure Docker is running
- Check Docker has enough resources allocated (at least 4GB RAM recommended)

### Port conflicts
- If ports 3000, 3001, or 8081 are already in use, VS Code will prompt you to use different ports

### Dependencies not installing
- Try rebuilding the container: `F1` → "Dev Containers: Rebuild Container"
- Check that you have internet connectivity

### Shared package not building
- Manually build it: `npm run build -- --filter=shared`

## Notes

- The container runs as the `node` user (not root)
- All project files are mounted into the container
- Node modules are installed inside the container
- The `.turbo` cache is preserved between container rebuilds
