# Firebase setup

## 1. Create the Firebase project

1. Open the [Firebase console](https://console.firebase.google.com/).
2. Create a project, for example `household-expenses-app`.
3. Add a **Web app** inside the project. Expo uses the Firebase JavaScript SDK, so a Web app configuration is correct for iPhone and Android development.
4. Copy the six configuration values shown by Firebase.

## 2. Configure local environment variables

From the repository root:

```bash
cp .env.example .env
```

Fill in:

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

Expo embeds `EXPO_PUBLIC_` values in the client bundle. Firebase web configuration values identify the project; access control comes from Authentication and Firestore rules. Never put service-account keys or admin credentials in this file.

Restart Expo after changing `.env`.

## 3. Enable email/password authentication

In Firebase Console:

1. Go to **Authentication → Get started**.
2. Open **Sign-in method**.
3. Enable **Email/Password**.

## 4. Create Cloud Firestore

1. Go to **Firestore Database → Create database**.
2. Choose a region near the household.
3. Start in production mode.

The app creates its collections on first use; no manual documents are needed.

## 5. Deploy the security rules

Install the Firebase CLI and sign in:

```bash
npm install --global firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

Select the project created above when `firebase use --add` asks.

Alternatively, paste the contents of `firebase.rules` into **Firestore Database → Rules** in the Firebase Console and publish them.

The rules enforce:

- users can read only their own profile;
- only household members can read household expenses and categories;
- only the creator of an expense can edit or delete it;
- invite documents cannot be listed;
- default categories cannot be changed or deleted;
- public unauthenticated access is denied.

## 6. Data layout

```text
users/{userId}
households/{householdId}
households/{householdId}/expenses/{expenseId}
households/{householdId}/categories/{categoryId}
invites/{inviteCode}
```

The `members` map on a household stores display information for dashboard attribution. The `memberIds` list is used by Firestore security rules.

## 7. Create and join a household

1. Register the first account.
2. Choose **Create a household** and give it a name.
3. Open **Settings** and share the 8-character invite code.
4. Register or log into a second account on another device.
5. Choose **Join with invite code**.

Firestore listeners update both devices automatically while they are online.
