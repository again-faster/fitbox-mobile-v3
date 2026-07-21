# Fitbox preview releases

The preview builds are isolated from the existing production and development apps.

| Platform | Identifier | Channel |
| --- | --- | --- |
| iOS | `com.againfaster.fitbox.preview` | TestFlight |
| Android | `com.againfaster.fitbox.preview` | Google Play internal testing |

## Android one-time setup

1. Create a new Play Console app named `fitbox Preview` with package name `com.againfaster.fitbox.preview`.
2. Enrol the new app in Play App Signing.
3. Add the first signed AAB manually to the internal testing track. The upload action requires this first manual bundle.
4. Create or authorize a Google Play Developer API service account with only the permissions needed to release this app to testing tracks.
5. Allow `android-preview-ci` in the existing `testflight-preview` GitHub environment. This reuses the same preview-only `.env` without exposing or copying its value.
6. Add these Android-specific environment secrets to `testflight-preview`:
   - `ANDROID_PREVIEW_KEYSTORE_BASE64`
   - `ANDROID_PREVIEW_KEY_ALIAS`
   - `ANDROID_PREVIEW_KEYSTORE_PASSWORD`
   - `ANDROID_PREVIEW_KEY_PASSWORD`
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

The preview Android build intentionally disables Google/Firebase services until a Firebase Android app is registered for the preview package. Push notifications are disabled in preview builds; the rest of the app remains available for beta testing.

## Routine release

Run the registered `build-ios-app.yml` workflow from `android-preview-ci`. On this isolated branch it is named **Build Android preview** and contains only the Android preview job; the default branch keeps its existing iOS workflow. Leave **Upload to Play** off to produce and inspect an AAB artifact. Turn it on after the first manual Play upload and service-account setup.

The workflow builds only `com.againfaster.fitbox.preview`, uploads only to the `internal` track, and cannot run from another branch.
