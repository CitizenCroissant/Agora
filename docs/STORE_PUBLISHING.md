# Publishing Agora to App Stores

Step-by-step guide to publish the Agora mobile app to the **Google Play Store** and **Apple App Store** using **EAS (Expo Application Services)**.

---

## Prerequisites

### Developer Accounts

| Platform                    | Cost           | URL                                   | Verification Time |
| --------------------------- | -------------- | ------------------------------------- | ----------------- |
| **Google Play Console**     | $25 (one-time) | https://play.google.com/console       | 1-2 days          |
| **Apple Developer Program** | $99/year       | https://developer.apple.com/programs/ | 1-3 days          |

Sign up for both **before** proceeding. Verification can take days.

### Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login

# Verify you're logged in
eas whoami
```

### EAS Project Link

The project is already linked to EAS (project ID: `2ea8b6bc-7bec-4d5e-8332-161246c93249`). If you need to re-link:

```bash
cd apps/mobile
eas init
```

---

## Part 1: Google Play Store (Android)

### Step 1: Create Your App in Google Play Console

1. Go to https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - **App name**: Agora
   - **Default language**: French (France)
   - **App or game**: App
   - **Free or paid**: Free
4. Accept the declarations and click **Create app**

### Step 2: Complete the Store Listing

In the Google Play Console, go to **Grow > Store presence > Main store listing**:

- **Short description** (80 chars max):

  > Suivez l'agenda de l'Assemblée nationale en temps réel.

- **Full description** (4000 chars max):

  > Agora vous permet de consulter l'agenda de l'Assemblée nationale française. Retrouvez les séances plénières, les commissions, et les ordres du jour en un coup d'œil.
  >
  > Fonctionnalités :
  >
  > - Agenda du jour avec les séances en cours et à venir
  > - Calendrier pour naviguer entre les dates
  > - Détails des séances et ordres du jour
  > - Notifications pour les séances importantes
  > - Données officielles de data.assemblee-nationale.fr

- **Screenshots**: Required (see [Store Assets](#store-assets) section below)
- **App icon**: 512x512 PNG (high-res, no transparency)
- **Feature graphic**: 1024x500 PNG or JPG

### Step 3: Complete the Content Rating Questionnaire

Go to **Policy > App content > Content rating**:

- Start the questionnaire
- Category: **Reference / News** (not a game)
- Answer all questions honestly (no violence, no user-generated content, etc.)
- You should get an **Everyone / PEGI 3** rating

### Step 4: Set Up a Google Play Service Account (for automated submissions)

This allows EAS Submit to upload builds directly to Google Play.

1. Go to **Google Cloud Console** > https://console.cloud.google.com
2. Create or select a project
3. Enable the **Google Play Android Developer API**
4. Go to **IAM & Admin > Service Accounts**
5. Click **Create Service Account**:
   - Name: `eas-submit`
   - Role: no role needed at GCP level
6. Create a **JSON key** for this service account and download it
7. Save it as `apps/mobile/play-store-service-account.json`
8. **Add it to `.gitignore`** (already sensitive)

Then in Google Play Console:

1. Go to **Settings > API access**
2. Link the Google Cloud project
3. Find your service account and click **Manage Play Console permissions**
4. Grant: **Release to production, manage testing tracks**
5. Add the app to the service account's access

### Step 5: Build for Android

```bash
cd apps/mobile

# Build a production Android App Bundle (.aab)
eas build --platform android --profile production
```

This will:

- Build in the cloud on EAS servers
- Use the `production` profile from `eas.json`
- Produce an `.aab` file (required by Play Store)
- Inject `EXPO_PUBLIC_API_URL` with the production API URL
- Auto-increment the version code

First time: EAS will ask you to create or provide an Android keystore. **Choose "Generate new keystore"** - EAS will manage it securely for you.

### Step 6: Submit to Google Play

```bash
# Submit the latest build to Google Play (internal testing track)
eas submit --platform android --profile production --latest
```

Or submit a specific build:

```bash
eas submit --platform android --profile production --id BUILD_ID
```

### Step 7: Promote Through Tracks

In Google Play Console:

1. **Internal testing** (default from our config) - test with up to 100 people
2. **Closed testing** - test with a larger group
3. **Open testing** - public beta
4. **Production** - full release

Promote from Internal > Closed > Production when ready.

---

## Part 2: Apple App Store (iOS)

### Step 1: Create an App ID

1. Go to https://developer.apple.com/account/resources/identifiers
2. Click **+** to register a new identifier
3. Select **App IDs** > **App**
4. Fill in:
   - **Description**: Agora
   - **Bundle ID**: Explicit > `com.agora.app`
5. Enable capabilities:
   - **Push Notifications** (for expo-notifications)
6. Click **Register**

### Step 2: Create the App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** > **+** > **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Agora
   - **Primary language**: French
   - **Bundle ID**: Select `com.agora.app`
   - **SKU**: `agora-app` (any unique string)
4. Click **Create**

### Step 3: Fill in App Store Metadata

Under **App Store** tab:

- **Subtitle** (30 chars):

  > Assemblée nationale

- **Description**:

  > Agora vous permet de consulter l'agenda de l'Assemblée nationale française. Retrouvez les séances plénières, les commissions, et les ordres du jour.

- **Keywords** (100 chars):

  > assemblée,nationale,parlement,agenda,séance,france,démocratie,transparence,politique

- **Support URL**: Your website or GitHub repo URL
- **Privacy Policy URL**: **Required** - must be a publicly accessible URL (see [Privacy Policy](#privacy-policy) section)
- **Screenshots**: Required for 6.7" and 5.5" displays minimum (see [Store Assets](#store-assets))

### Step 4: Update EAS Submit Config for iOS

After creating the app in App Store Connect, update `eas.json`:

1. Find your **App Store Connect App ID** (numeric ID shown in the URL when viewing your app: `https://appstoreconnect.apple.com/apps/XXXXXXXXXX`)
2. Find your **Apple Team ID** in https://developer.apple.com/account > Membership details
3. Update `apps/mobile/eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
}
```

### Step 5: Build for iOS

```bash
cd apps/mobile

# Build a production iOS archive (.ipa)
eas build --platform ios --profile production
```

First time: EAS will guide you through Apple credentials:

- You'll need your **Apple ID** and **app-specific password** (generate at https://appleid.apple.com/account/manage > App-Specific Passwords)
- EAS will create and manage provisioning profiles and certificates for you
- Choose **"Let Expo handle it"** when asked about credentials

### Step 6: Submit to App Store

```bash
# Submit the latest iOS build to App Store Connect
eas submit --platform ios --profile production --latest
```

### Step 7: Submit for Review

In App Store Connect:

1. Go to your app > **App Store** tab
2. Select the build that was uploaded
3. Fill in the **Review Information**:
   - Contact info for the review team
   - Notes: "This app displays publicly available parliamentary agenda data from the French National Assembly."
4. Click **Submit for Review**

Apple review typically takes **24-48 hours** (can be longer for first submissions).

---

## Build Both Platforms at Once

```bash
cd apps/mobile

# Build for both platforms simultaneously
eas build --platform all --profile production

# Submit both after builds complete
eas submit --platform all --profile production --latest
```

---

## Store Assets

### Screenshots

You need screenshots for each required device size. The easiest approach is to use the iOS Simulator and Android Emulator:

**iOS required sizes:**
| Device | Resolution |
|--------|-----------|
| iPhone 6.7" (15 Pro Max) | 1290 x 2796 |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 |
| iPhone 5.5" (8 Plus) | 1242 x 2208 |
| iPad 12.9" (if supporting tablet) | 2048 x 2732 |

**Android required:**

- Minimum 2 screenshots, up to 8
- Phone: 16:9 aspect ratio recommended
- Min dimensions: 320px, Max: 3840px

**Tips:**

- Take screenshots from a production build (not dev)
- Show the app with real data
- Recommended screens: Today's agenda, Calendar view, Sitting detail, About page

### App Icon

- **iOS**: 1024x1024 PNG, no transparency, no rounded corners (Apple adds them)
- **Android**: 512x512 PNG, no transparency for Play Store listing

Your current icon at `assets/icon.png` should work. Verify it meets these specs.

### Feature Graphic (Android only)

- 1024x500 PNG or JPG
- Displayed at the top of your Play Store listing

---

## Privacy Policy

Both stores **require** a privacy policy URL. Since Agora uses public data and minimal user data, a simple policy works:

Create a privacy policy page at your website or as a GitHub page. It should mention:

- What data the app collects (push notification tokens, if applicable)
- That the app displays publicly available parliamentary data
- No user accounts or personal data collection
- Contact information

You can host this at:

- A page on your web app (e.g., `/privacy`)
- A GitHub Pages site
- Any publicly accessible URL

---

## Content Rating / Age Rating

- **Google Play**: Complete the content rating questionnaire (IARC). Category: Reference/News. Expected rating: **Everyone**.
- **Apple**: Set age rating in App Store Connect. Since the app has no objectionable content: **4+**.

---

## Version Management

EAS manages versions automatically via `appVersionSource: "remote"` in `eas.json`:

- `autoIncrement: true` in the production profile bumps the build number on each build
- Version string (`1.0.0`) is set in `app.json` - update this for major releases
- Build numbers are managed by EAS remotely

To manually set versions:

```bash
eas build:version:set --platform android
eas build:version:set --platform ios
```

---

## OTA Updates (Over-the-Air)

The app is configured for EAS Updates (in `app.json` with `runtimeVersion` and `updates` config). This allows you to push JavaScript updates without going through the store review process:

```bash
# Push an update to production
eas update --branch production --message "Fix: corrected date formatting"
```

Note: OTA updates can only change JavaScript/assets. Native code changes (new permissions, new native modules) require a new store build.

---

## Checklist Before Submitting

### Code

- [ ] Production API URL is set (`EXPO_PUBLIC_API_URL` in `eas.json`)
- [ ] No localhost URLs in production code
- [ ] No debug logging in production
- [ ] App works correctly when built with `production` profile

### Google Play Store

- [ ] Developer account created and verified
- [ ] App created in Google Play Console
- [ ] Store listing completed (title, description, screenshots)
- [ ] Content rating questionnaire completed
- [ ] Privacy policy URL provided
- [ ] Service account key for EAS Submit (`play-store-service-account.json`)
- [ ] Target API level meets Google's requirements (EAS handles this)
- [ ] Data safety form completed in Play Console

### Apple App Store

- [ ] Developer account enrolled ($99/year)
- [ ] App ID registered in Developer Portal
- [ ] App created in App Store Connect
- [ ] Store listing completed (description, keywords, screenshots)
- [ ] Age rating set (4+)
- [ ] Privacy policy URL provided
- [ ] App privacy nutrition labels completed in App Store Connect
- [ ] `ascAppId` and `appleTeamId` set in `eas.json`
- [ ] Review notes prepared for Apple reviewers

### Both

- [ ] App icon at correct resolution
- [ ] Screenshots for required device sizes
- [ ] Version set to `1.0.0` (in `app.json`)
- [ ] Tested on physical devices (both platforms)

---

## Common Issues

### "App signing key not found"

Run `eas credentials` to manage your signing keys. For Android, EAS generates and stores the keystore. For iOS, EAS manages certificates and provisioning profiles.

### Build fails with "Shared package not found"

The monorepo setup requires `@agora/shared` to be built. EAS should handle this via the `metro.config.js` workspace resolution. If not, add a `prebuild` script.

### Apple Review Rejection

Common reasons:

- Missing privacy policy
- Incomplete metadata
- Crashes during review
- "Not enough content" - ensure the app has real data
  Include clear review notes explaining the app uses public parliamentary data.

### Google Play Rejection

Common reasons:

- Missing data safety declarations
- Incomplete store listing
- Privacy policy issues

---

## Quick Reference Commands

```bash
cd apps/mobile

# Build
eas build --platform android --profile production   # Android only
eas build --platform ios --profile production        # iOS only
eas build --platform all --profile production        # Both

# Submit
eas submit --platform android --profile production --latest
eas submit --platform ios --profile production --latest

# Check build status
eas build:list

# Manage credentials
eas credentials --platform android
eas credentials --platform ios

# Push OTA update
eas update --branch production --message "description"

# Check versions
eas build:version:get --platform android
eas build:version:get --platform ios
```

---

## Estimated Timeline

| Step                                                  | Time                  |
| ----------------------------------------------------- | --------------------- |
| Developer account setup + verification                | 1-3 days              |
| Store listing preparation (descriptions, screenshots) | 1-2 days              |
| First production build (both platforms)               | 20-40 min (EAS cloud) |
| First submission                                      | 30 min                |
| Google Play review                                    | 1-7 days (first app)  |
| Apple review                                          | 1-3 days              |
| **Total to first store release**                      | **~1-2 weeks**        |

After the first release, subsequent updates are much faster (build + submit + review in 1-3 days).
