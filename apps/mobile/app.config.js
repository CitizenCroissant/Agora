/**
 * Dynamic Expo config. When both app.json and app.config.js exist, this is
 * evaluated and can override values. Used so EAS Build can inject
 * google-services.json via a file secret (GOOGLE_SERVICES_JSON) without
 * committing the file to the repo.
 */
export default ({ config }) => {
  const base = config ?? {};
  const expo = base.expo ?? {};
  const android = expo.android ?? {};
  const out = {
    ...base,
    // EAS CLI expects config.eas (e.g. projectId); app.json has it under expo.extra.eas
    eas: base.eas ?? expo.extra?.eas,
    expo: {
      ...expo,
      android: {
        ...android,
        // EAS Build: set env GOOGLE_SERVICES_JSON (type: file) in Expo dashboard.
        // Local dev: place google-services.json in apps/mobile/ (gitignored).
        googleServicesFile:
          process.env.GOOGLE_SERVICES_JSON ?? android.googleServicesFile,
      },
    },
  };
  return out;
};
