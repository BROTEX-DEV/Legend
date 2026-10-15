# LEGENDS — Firebase migration (draft branch)

This branch is an isolated migration draft. The live `main` branch and existing Supabase project have not been changed or deleted.

## Free-plan notes
Firebase Authentication and Cloud Firestore have no-cost usage quotas on the Spark plan. Limits apply. This draft does not use Cloud Functions or request a billing upgrade.

## 1. Create a Firebase project
1. Open https://console.firebase.google.com/ and create a project.
2. Do not enable billing or upgrade the plan.
3. In Project settings, add a Web app and copy its web configuration into `firebase-config.js`.
4. In Authentication > Sign-in method, enable Email/Password.
5. In Firestore Database, create the database and publish the rules from `firestore.rules`.

## 2. Provision the two accounts
The website keeps the password-only *screen*, mapping aliases to internal Firebase Auth email identities:
- ASTRO → `astro@legends.example.com`
- BROTEX → `brotex@legends.example.com`

Create those two accounts in Firebase Authentication using strong passwords. Do not put passwords in GitHub or in frontend JavaScript. The aliases are not a substitute for strong passwords.

## 3. Add member records securely
After creating the accounts, copy each UID from Authentication. In Firestore, create a `members/{UID}` document manually from the Firebase Console:
- ASTRO: `{ "displayName": "ASTRO", "role": "admin" }`
- BROTEX: `{ "displayName": "BROTEX", "role": "member" }`

Do not let browser code write these documents. The rules intentionally deny client writes to member roles.

## 4. Move data
The existing Supabase data is not automatically copied. Export and review records first, then manually import only the intended `case_files` into Firestore after verifying the field names. This draft does not modify Supabase or delete any data.

## 5. Test before publishing
- Test both accounts and sign-out.
- Test that a signed-in user without a `members/{UID}` record cannot read case files.
- Test that a member cannot create/edit/delete case files.
- Test that only the ASTRO account can write case files.
- Verify the app configuration contains no private/service-account key.
- Keep deployment on this branch until the configuration and security tests pass.

## Rollback
The original Supabase version remains on `main`. Do not merge this branch until Firebase setup, data migration, and tests are complete.
