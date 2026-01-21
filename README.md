# Agora 🏛️

> Democracy, today

Agora is a transparent, modern web and mobile application that shows what the French Assemblée nationale is working on today, this week, and beyond — all grounded in official open data.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.76-blue)](https://reactnative.dev/)

## ✨ Features

- 📅 **Today View**: See what's happening in parliament right now
- 📆 **Timeline**: Browse past and future agendas
- 📱 **Cross-Platform**: Beautiful web and mobile apps
- 🔍 **Detailed View**: Full agenda with official references
- 🔗 **Source Transparency**: Direct links to official data
- ⚡ **Fast & Modern**: Built with latest web technologies
- 🌐 **Open Source**: Fully transparent, MIT licensed
- ✅ **Real Data**: Integrated with live Assemblée nationale open data

> **New!** Phase 4 complete: Now fetching real parliamentary data from `data.assemblee-nationale.fr`

## 🏗️ Architecture

```
┌─────────────┐       ┌─────────────┐
│   Web App   │       │ Mobile App  │
│  (Next.js)  │       │   (Expo)    │
└──────┬──────┘       └──────┬──────┘
       │                     │
       └──────────┬──────────┘
                  ▼
         ┌────────────────┐
         │ Serverless API │
         │    (Vercel)    │
         └────────┬───────┘
                  ▼
         ┌────────────────┐
         │   Supabase     │
         │   (Postgres)   │
         └────────┬───────┘
                  ▲
         ┌────────┴───────┐
         │   Ingestion    │
         │   (Scheduled)  │
         └────────────────┘
```

## 📦 Project Structure

This is a **monorepo** containing:

```
Agora/
├── packages/
│   └── shared/          # Shared TypeScript types, API client, utilities
├── apps/
│   ├── api/             # Serverless API (Vercel Functions)
│   ├── ingestion/       # Data ingestion from official sources
│   ├── web/             # Next.js web application
│   └── mobile/          # React Native/Expo mobile app
├── database/            # Supabase schema and migrations
└── docs/                # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd Agora
   npm install
   ```

2. **Set up Supabase**:
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL in `database/schema.sql`
   - Get your Project URL and Service Key

3. **Configure environment variables**:
   ```bash
   # API
   cd apps/api
   cp env.example .env.local
   # Edit .env.local with your Supabase credentials

   # Web
   cd ../web
   cp env.example .env.local
   # Set NEXT_PUBLIC_API_URL
   ```

4. **Build shared package**:
   ```bash
   cd packages/shared
   npm run build
   ```

5. **Run development servers**:
   ```bash
   # Terminal 1 - API
   cd apps/api
   npm run dev

   # Terminal 2 - Web
   cd apps/web
   npm run dev
   ```

6. **Seed with mock data**:
   ```bash
   cd apps/ingestion
   npm run ingest -- --date 2026-01-22
   ```

7. **Open your browser**: http://localhost:3000

For detailed setup instructions, see [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md).

## 🧪 Testing & Linting

### Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Run Linting

```bash
# Lint all packages
npm run lint

# Lint and auto-fix issues
cd apps/web && npx eslint . --ext .ts,.tsx --fix
```

For comprehensive testing and linting documentation, see [docs/TESTING_AND_LINTING.md](docs/TESTING_AND_LINTING.md).

## 🛠️ Tech Stack

### Backend
- **Database**: [Supabase](https://supabase.com) (Managed Postgres)
- **API**: Serverless Functions (Vercel/Netlify compatible)
- **Ingestion**: Scheduled functions with cron

### Frontend
- **Web**: [Next.js 15](https://nextjs.org) (React, App Router)
- **Mobile**: [React Native](https://reactnative.dev) + [Expo](https://expo.dev)
- **Language**: TypeScript throughout
- **Styling**: CSS Modules (web), StyleSheet (mobile)

### Infrastructure
- **Deployment**: [Vercel](https://vercel.com) (API + Web)
- **Database**: Supabase Cloud
- **Mobile**: Expo Application Services

## 📚 Documentation

- [Setup Guide](docs/SETUP_GUIDE.md) - Detailed setup instructions
- [Architecture](docs/ARCHITECTURE.md) - Technical architecture
- [API Documentation](docs/API_DOCUMENTATION.md) - REST API reference
- [Testing and Linting](docs/TESTING_AND_LINTING.md) - Testing and code quality guide
- [Contributing](CONTRIBUTING.md) - How to contribute

## 🎯 Current Status

**Version**: 0.1.0 - MVP

✅ **Complete**:
- Full-stack architecture
- Database schema
- Serverless API with 3 endpoints
- Web app with all pages
- Mobile app with navigation
- Data ingestion system
- Complete documentation
- Linting (ESLint + TypeScript)
- Testing framework (Vitest + Jest)
- CI/CD pipeline with automated tests

🚧 **In Progress**:
- Integration with real Assemblée nationale API (currently uses mock data)
- Error monitoring

📋 **Planned**:
- Search functionality
- Push notifications (mobile)
- Deputy profiles
- Historical data archive
- Vote tracking

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- 🌍 Translate to other languages

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Data from [Assemblée nationale](https://www.assemblee-nationale.fr)
- Open data portal: [data.assemblee-nationale.fr](https://data.assemblee-nationale.fr)
- Built with amazing open-source tools

## 📧 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Made with ❤️ for civic transparency**
