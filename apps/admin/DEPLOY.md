# Deploying Zorvique Admin (`zorvique-admin`) & Security Rules

1. Install dependencies cleanly:
   ```bash
   npm ci
   ```

2. Configure `.env.local` with your Firebase Web SDK `VITE_FIREBASE_*` keys (see `.env.example`).

3. Build production assets:
   ```bash
   npm run build
   ```

4. Create the Firebase Hosting site (first time only):
   ```bash
   firebase hosting:sites:create zorvique-admin
   ```

5. Apply the hosting target `admin` (replace `YOUR_FIREBASE_PROJECT_ID` in `.firebaserc` first):
   ```bash
   firebase target:apply hosting admin zorvique-admin
   ```

6. Deploy the admin app:
   ```bash
   firebase deploy --only hosting:admin
   ```

7. Deploy shared Firestore and Storage security rules + indexes:
   ```bash
   firebase deploy --only firestore,storage
   ```

## Creating the Owner Account in Firebase Console
1. Open Firebase Console -> **Authentication** -> **Sign-in method** and enable **Email/Password**.
2. Go to **Users** -> **Add user** and create `lessuse611@gmail.com` with a strong password (never store passwords in source code).
3. Ensure the owner account email is marked verified (`email_verified: true`) via verification link or Firebase Admin SDK, as Firestore security rules enforce verified email claims.
