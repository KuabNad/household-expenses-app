# Web deployment on GitHub Pages

The same Expo codebase can run as a browser application. GitHub Pages hosts the compiled static files, while Firebase Authentication and Firestore provide login and private synchronized data.

The production URL is:

```text
https://kuabnad.github.io/household-expenses-app/
```

## 1. Configure Firebase

Complete the Firebase project setup in [setup.md](setup.md):

1. Enable Email/Password authentication.
2. Create Cloud Firestore.
3. Deploy `firebase.rules`.
4. Register a Firebase Web app and copy its configuration values.

In **Firebase Console → Authentication → Settings → Authorized domains**, add:

```text
kuabnad.github.io
```

Without this authorized domain, Firebase rejects login attempts from GitHub Pages.

## 2. Add GitHub repository variables

Open:

```text
https://github.com/KuabNad/household-expenses-app/settings/variables/actions
```

Create these repository variables using the values from the Firebase Web app:

```text
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

Firebase Web configuration values are public project identifiers, not admin credentials. Never add a service-account private key.

## 3. Enable GitHub Pages

Open **Repository Settings → Pages** and set **Source** to **GitHub Actions**.

The workflow at `.github/workflows/deploy-pages.yml` then:

1. installs dependencies;
2. checks TypeScript;
3. runs tests;
4. exports the Expo web application;
5. deploys the `dist` directory to GitHub Pages.

Every push to `main` automatically redeploys the website.

## 4. Run the browser version locally

```bash
cp .env.example .env
# Fill in the Firebase values
npm install
npm run web
```

Open the local URL shown by Expo, normally `http://localhost:8081`.

## Security model

- The GitHub repository and website code may be public.
- Household records remain private in Firestore.
- Firebase security rules decide which authenticated users can access each household.
- The Firebase Web API key does not grant administrator access.
- Service-account keys must never be used in the browser or GitHub Pages workflow.
