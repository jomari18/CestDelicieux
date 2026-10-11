# Android build and installation

This project bundles the React production build in Capacitor; it does not load a development server. Application ID: `com.jomaricandido.cestdelicieux`. Minimum Android version: API 24; compile/target API 36.

On Windows, run `powershell -File tools/provision-android.ps1`, then `npm run build`, `npm run android:sync`, and `npm run android:build`. Provisioning installs a checksum-verified Temurin JDK 21 and Google SDK command-line tools in ignored `.local-tools/android`, and installs API 36/build tools 36.0.0. It requires network access and Android SDK license acceptance.

The generated debug APK is `outputs/CestDelicieux-debug.apk`; its SHA-256 companion is generated after `apksigner verify` and `aapt dump badging`. Copy it to an Android phone and allow installation from that source. This is a locally signed debug build, not a Play Store release. Release signing keys are deliberately not included.

The first Windows build hit Gradle 8.14.3's documented transform-cache rename failure (AccessDeniedException). Copying the completed temporary transform into its missing immutable cache directory, within the ignored project cache, allowed the build to complete. No security settings were disabled. A fresh machine may need the same cache recovery or a separately verified compatible Gradle update; see [Gradle issue 38921](https://github.com/gradle/gradle/issues/38921).

The app includes safe-area spacing, keyboard-friendly forms, explicit location permission requests, an offline notice, and Back handling that closes dialogs before navigating and confirms exit at the root. No emulator or physical Android device was connected during this audit: installation, keyboard behavior, system bars, GPS permission prompts and lifecycle behavior remain device checks. Email verification can use the code in the email; native confirmation-link deep linking is not configured.

Keep Supabase public settings in local build configuration, and routing/service keys only in the Edge Function. Native requests use the origin `https://localhost`, which must be in the function's exact allowlist.
