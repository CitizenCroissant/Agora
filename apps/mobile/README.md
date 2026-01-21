# Mobile App

React Native/Expo mobile application for Agora.

## Features

- **Today Tab**: Current day's agenda with date navigation
- **Timeline Tab**: Scrollable calendar view
- **About Tab**: Information about the project
- **Sitting Details**: Full agenda details for each sitting

## Tech Stack

- React Native 0.76
- Expo 52
- Expo Router 4 (file-based routing)
- TypeScript
- Shared package for API client and types

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API URL:
   - The API URL is configured in `config.ts`
   - For development: it automatically uses `http://localhost:3000/api` for web and your local IP for mobile
   - To customize, edit `config.ts` or add `apiUrl` to `app.json` under `expo.extra`
   - For production: set the API URL in your build configuration

3. Start development server:
   ```bash
   npm start
   ```

4. Run on device or simulator:
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web (for testing)
   npm run web
   ```

## Project Structure

- `app/` - Expo Router pages
  - `(tabs)/` - Tab navigation screens
    - `index.tsx` - Today tab
    - `timeline.tsx` - Calendar tab
    - `about.tsx` - About tab
  - `sitting/[id].tsx` - Sitting detail screen
  - `_layout.tsx` - Root layout

## Assets

The app requires the following asset files:
- `assets/icon.png` - App icon (1024x1024)
- `assets/adaptive-icon.png` - Android adaptive icon (1024x1024)
- `assets/splash.png` - Splash screen (1242x2436)
- `assets/favicon.png` - Web favicon (48x48)

## Building

For production builds:

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

Requires an Expo account and EAS CLI setup.

## Design

Uses French government color scheme:
- Primary: #0055a4 (French blue)
- Secondary: #ef4135 (French red)
- Clean, mobile-optimized interface
