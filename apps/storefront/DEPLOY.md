# Deploying Zorvique Storefront (`zorvique-store`)

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
   firebase hosting:sites:create zorvique-store
   ```

5. Apply the hosting target `store` (replace `YOUR_FIREBASE_PROJECT_ID` in `.firebaserc` first):
   ```bash
   firebase target:apply hosting store zorvique-store
   ```

6. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting:store
   ```
