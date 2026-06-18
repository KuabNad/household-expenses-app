# Household Expenses

A calm, practical shared expense tracker for a household. It runs in Expo Go on iPhone, synchronizes data through Firebase, and keeps each household's financial data private.

## What works in v1

- Email/password registration and login
- Create a household with 10 default categories
- Join a household using an 8-character invite code
- Real-time shared expense and category updates
- Add expenses with amount, currency, date, category, note, payer, and payment method
- Edit and delete only expenses created by the signed-in user
- Create, edit, and delete shared custom categories
- Monthly dashboard with totals by currency, category bars, payer totals, and recent expenses
- Month filtering
- Loading, empty, validation, and network-error states
- Firebase Authentication persistence on iPhone
- Deployable Firestore security rules
- Automated summary tests and a complete manual test checklist

## Stack

- React Native 0.85 with Expo SDK 56
- TypeScript
- React Navigation 7
- Firebase Authentication
- Cloud Firestore with real-time listeners
- Vitest for pure summary logic

Firebase was chosen over Supabase for this first version because the JavaScript SDK works directly in Expo Go, email/password authentication is small to configure, and Firestore listeners make two-person synchronization straightforward.

## Repository structure

```text
.
├── App.tsx
├── backend/
├── docs/
├── firebase.json
├── firebase.rules
├── src/
│   ├── components/
│   ├── hooks/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── types/
│   └── utils/
├── .env.example
├── app.json
├── eas.json
└── package.json
```

## Run locally

Requirements:

- Node.js 22.13 or newer
- npm
- A Firebase project configured as described below

```bash
git clone https://github.com/KuabNad/household-expenses-app.git
cd household-expenses-app
npm install
cp .env.example .env
```

Fill in `.env`, then:

```bash
npm start
```

Useful checks:

```bash
npm run typecheck
npm test
npx expo-doctor
```

## Configure Firebase

Follow [docs/setup.md](docs/setup.md). The short version:

1. Create a Firebase project and register a Web app.
2. Enable Email/Password in Firebase Authentication.
3. Create a Cloud Firestore database in production mode.
4. Copy `.env.example` to `.env` and add the Firebase Web app values.
5. Deploy `firebase.rules` with the Firebase CLI or paste it into the Firebase Console.

No service-account key or backend secret belongs in the app.

## Test on iPhone

Install Expo Go on the iPhone, run `npm start`, and scan the QR code. The Mac and iPhone should normally be on the same Wi-Fi network.

If local networking is awkward:

```bash
npx expo start --tunnel
```

See [docs/iphone-testing.md](docs/iphone-testing.md) for two-account testing and EAS Build instructions.

## Household invitation flow

1. The first user registers and creates a household.
2. The app creates the default categories and a random invite code.
3. The first user shares the code from Settings.
4. The second user registers, selects **Join with invite code**, and enters it.
5. Both users receive shared Firestore updates while online.

## Data model

### User

`id`, `email`, `displayName`, `householdId`, `createdAt`

### Household

`id`, `name`, `inviteCode`, `members`, `memberIds`, `createdBy`, `createdAt`

### Expense

`id`, `householdId`, `amount`, `currency`, `date`, `categoryId`, `description`, `paidByUserId`, `paymentMethod`, `createdBy`, `createdAt`, `updatedAt`

### Category

`id`, `householdId`, `name`, `icon`, `color`, `isDefault`, `createdBy`, `createdAt`

## EAS Build for iPhone later

After local Expo Go testing is complete:

```bash
npm install --global eas-cli
eas login
eas init
eas build:configure
eas build --platform ios --profile preview
```

The included `eas.json` has development, preview, and production profiles. `eas init` adds the project ID to `app.json`. An Apple Developer account is needed for normal iOS distribution.

## Testing

```bash
npm test
```

The manual end-to-end checklist is in [docs/testing-checklist.md](docs/testing-checklist.md).

## Known limitations / TODO

- Firestore's web SDK provides resilient UI error handling, but full queued offline writes are not enabled in Expo Go. Add a local outbox if offline-first entry becomes important.
- A household cannot yet be renamed, left, transferred, or deleted from the app.
- Invite codes do not expire or rotate in v1.
- There is no currency conversion; each currency is summarized separately to avoid misleading totals.
- There are no receipt photos, recurring expenses, budgets, exports, push notifications, or password-reset screen yet.
- EAS and App Store credentials must be configured by the repository owner.

## License

MIT
