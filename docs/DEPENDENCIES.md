# Dependencies and security

## Vulnerabilities (fixed)

As of the last audit, **0 vulnerabilities** are reported. The following were addressed:

- **path-to-regexp** (ReDoS, high): Pinned to `6.3.0` via root `overrides` (was 4.x–6.2.x in Vercel’s tree).
- **undici** (moderate): Pinned to `6.23.0` via root `overrides` (fixes random values and decompression issues).
- **vercel** CLI: Bumped to `^50.13.2` (root and api).

Root `package.json` contains:

```json
"overrides": {
  "vite": "^7.0.0",
  "path-to-regexp": "6.3.0",
  "undici": "6.23.0"
}
```

Run `npm audit` after any dependency change to re-check.

## Deprecated packages (transitive)

These appear as “deprecated” in `npm install` but come from **transitive** dependencies. We don’t depend on them directly; upgrading them would require upgrading the parent packages.

| Package        | From                         | Note |
|----------------|------------------------------|------|
| inflight@1.0.6 | glob@7 (Expo / React Native) | Will go away when Expo/RN deps use newer glob. |
| glob@7.2.3     | Expo, react-native, babel-jest | Same as above. |
| rimraf@3.0.2   | chromium-edge-launcher → Expo | Replaced in newer tooling. |
| uuid@3.4.0     | @expo/ngrok                  | Upgrade when Expo/ngrok bump. |
| node-domexception@1.0.0 | (various)               | Replaced by native `DOMException` where supported. |

They are **not** direct dependencies of Agora; fixing them would mean upgrading the **Expo / React Native** stack (e.g. Expo SDK, react-native, Babel/Jest-related deps) and accepting any breaking changes there.

## Outdated packages (optional upgrades)

These have newer versions available. Only non-breaking or low-risk bumps were applied; the rest are listed for planned upgrades.

### Already bumped (safe)

- **vercel**: ^50.4.8 → ^50.13.2 (root, api)
- **@vercel/node**: ^5.3.21 → ^5.5.33 (api)
- **dotenv**: ^16.4.7 → ^16.6.1 (api, ingestion)
- **@vitejs/plugin-react**: ^4.3.4 → ^5.1.3 (web)
- **jsdom**: ^27.2.0 → ^28.0.0 (web)

### Major / breaking (review before upgrading)

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| eslint | ^9.x | 10.x | May need config and rule updates. |
| @eslint/js | ^9.x | 10.x | Follows ESLint major. |
| dotenv | 16.x | 17.x | Check changelog for breaking changes. |
| expo-server-sdk | 4.x | 5.x | API changes possible. |
| @types/node | ^22 | 25.x | Align with Node LTS and TS. |
| react / react-dom (mobile) | 19.1 | 19.2 | Usually safe; align with Expo. |
| react-native | 0.81 | 0.83 | Upgrade with Expo SDK. |
| react-native-screens | 4.16 | 4.23 | Prefer upgrading with Expo. |
| @react-native-community/datetimepicker | 8.4 | 8.6 | Patch/minor. |
| eslint-plugin-react-hooks (mobile) | 5.x | 7.x | Major; update with ESLint. |

### Mobile (Expo) stack

Expo and React Native versions are best upgraded together (e.g. follow [Expo SDK upgrade guide](https://docs.expo.dev/workflow/upgrading-expo/)). The deprecated glob/inflight/rimraf/uuid warnings will decrease as the Expo and React Native dependency trees are updated.

## Checking status

```bash
npm audit          # Vulnerabilities
npm outdated       # Outdated deps (root + workspaces)
npm install        # Reproduces deprecation warnings if any
```
