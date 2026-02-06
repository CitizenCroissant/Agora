# Creating a Development Build for Push Notifications

## Prerequisites

1. **Expo account** (free): Sign up at https://expo.dev
2. **EAS CLI**: Install globally: `npm install -g eas-cli`
3. **Android device** or emulator for testing

## Step 1: Install EAS CLI and Login

```bash
npm install -g eas-cli
eas login
```

## Step 2: Configure EAS Project

```bash
cd apps/mobile
eas build:configure
```

This will:

- Create/update `eas.json` (already created)
- Ask if you want to set up EAS project (yes)
- Generate a project ID and add it to `app.json`

## Step 3: Update app.json with Project ID

After running `eas build:configure`, it will add a `projectId` to `app.json`. This is needed for push notifications.

## Step 4: Set Up Firebase Cloud Messaging (FCM) Credentials

**IMPORTANT**: Push notifications on Android require Firebase credentials. Without this, you'll get "Default FirebaseApp is not initialized" errors.

### 4a. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Add an Android app with package name: `com.agora.app` (from `app.json`)

### 4b. Download google-services.json

1. In Firebase Console, go to Project Settings > Your Android App
2. Download `google-services.json`
3. Place it in `apps/mobile/google-services.json`
4. Commit the file (it's safe to commit - contains only public identifiers per Expo docs)

### 4c. Configure app.json

The `google-services.json` file is automatically detected by Expo. No manual configuration needed in `app.json` for SDK 54+.

### 4d. Upload FCM V1 Service Account Key to EAS

1. In Firebase Console, go to **Project Settings > Service Accounts**
2. Click **"Generate New Private Key"**
3. Save the JSON file securely (this is your service account key)
4. Upload to EAS:

```bash
cd apps/mobile
eas credentials
```

Then follow the prompts:

- Select **Android**
- Select **production** (or the profile you're using)
- Select **Google Service Account**
- Select **"Manage your Google Service Account Key for Push Notifications (FCM V1)"**
- Select **"Set up a Google Service Account Key for Push Notifications (FCM V1)"**
- Select **"Upload a new service account key"**
- Provide the path to your downloaded service account JSON file

**Alternative**: You can also upload via EAS Dashboard:

- Go to https://expo.dev
- Select your project
- Go to **Project Settings > Credentials**
- Select your Android Application Identifier
- Under **Service Credentials > FCM V1 service account key**, click **"Add a service account key"**
- Upload the JSON file

## Step 5: Build Development Build for Android

```bash
cd apps/mobile
eas build --platform android --profile development
```

This will:

- Upload your code to EAS servers
- Build the APK in the cloud (takes ~10-20 minutes)
- Provide a download link when complete

**Note:** First build requires setting up Android credentials (keystore). EAS will guide you through this.

## Step 6: Install on Your Device

1. Download the APK from the EAS build page
2. Transfer to your Android device
3. Enable "Install from unknown sources" if needed
4. Install the APK

## Step 7: Start Development Server

```bash
cd apps/mobile
npm run dev
# Or: npx expo start --dev-client
```

## Step 8: Connect Your Device

1. Open the development build app on your device
2. Scan the QR code or enter the URL manually
3. The app will load with your code

## Step 9: Test Push Notifications

1. In the app, go to **About** tab
2. Toggle **Notifications push** ON
3. Grant permission when prompted
4. The app will register the push token with your API
5. Test sending a notification (see testing guide)

## Alternative: Local Development Build (Faster for Testing)

If you want to build locally (requires Android SDK):

```bash
cd apps/mobile
eas build --platform android --profile development --local
```

This builds on your machine but requires:

- Android SDK installed
- More setup time
- But faster iteration

## Troubleshooting

### Common Issues

- **"No project ID"**: Run `eas build:configure` again
- **"Default FirebaseApp is not initialized"**: This is the most common issue. Check:
  1. ✅ `google-services.json` exists in `apps/mobile/` directory
  2. ✅ FCM V1 service account key is uploaded to EAS (check via `eas credentials`)
  3. ✅ **CRITICAL: You rebuilt the app after adding credentials** (credentials are baked into the build)
  4. ✅ `app.json` has `"googleServicesFile": "./google-services.json"` in android section
  5. ✅ Package name matches: `com.agora.app` in both Firebase and `app.json`
- **Build fails**: Check EAS build logs at https://expo.dev
- **Can't install APK**: Enable "Install from unknown sources" in Android settings
- **App won't connect**: Make sure dev server is running and device is on same network
- **Push token fails**: Make sure you're using a development build (not Expo Go) and have granted notification permissions
- **Still getting Firebase error after rebuild**:
  - Verify you're opening the development build app (not Expo Go)
  - Uninstall old app completely and reinstall new build
  - Check build logs for Firebase-related errors

## Next Steps

Once you have a development build:

1. Test push notification registration
2. Test receiving notifications via Expo Push Tool
3. Test the cron endpoint
4. Test notification tap navigation
