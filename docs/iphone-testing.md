# Test on iPhone with Expo Go

## Before starting

- Complete `docs/setup.md`.
- Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) on the iPhone.
- Put the Mac and iPhone on the same Wi-Fi network.

## Run the app

```bash
npm install
npm start
```

Scan the QR code shown by Expo CLI using the iPhone Camera app. Tap the banner to open the project in Expo Go.

If the phone cannot reach the development server:

```bash
npx expo start --tunnel
```

Tunnel mode is slower but works around many guest Wi-Fi, VPN, and firewall problems.

## Test two household members

The cleanest test uses two physical phones. For a one-phone check:

1. Register account A and create a household.
2. Note the invite code in Settings.
3. Log out.
4. Register account B and join with the code.
5. Add an expense as account B.
6. Log out and sign back in as account A.
7. Confirm the expense appears.

## Build an installable iOS app later

An Apple Developer account is required for normal device distribution and App Store builds.

```bash
npm install --global eas-cli
eas login
eas init
eas build:configure
eas build --platform ios --profile preview
```

`eas init` adds the EAS project ID to `app.json`. Use the `production` profile when preparing an App Store build:

```bash
eas build --platform ios --profile production
```

App Store submission is intentionally outside v1.
