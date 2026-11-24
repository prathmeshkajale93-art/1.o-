# Hotel Concierge — standalone (Firebase + Netlify)

Guests scan a room QR code and open `https://YOUR-SITE/#r-204` with no account and no access code.
Staff sign in with email and password. The AI key and account creation live in Netlify Functions only.

```
index.html                    the whole app (guest, reception, staff, owner)
fb.js, firebase-config.js     Firebase connection (config is public by design)
firestore.rules               database security rules
netlify/functions/chat.js     AI Concierge (Anthropic key stays here)
netlify/functions/staff-admin.js  owner-only: create/remove staff accounts
netlify/lib/admin.js          shared Admin SDK setup
netlify.toml, package.json    Netlify settings and dependency (firebase-admin)
```

Pages: `/#r-<room>` guest · `/#reception` · `/#staff` · `/#admin` (owner).

## 1. Firebase setup
1. console.firebase.google.com → **Add project**.
2. **Build → Firestore Database → Create database** (production mode, pick a region near you).
3. **Build → Authentication → Get started**. Under **Sign-in method** enable **Email/Password** and **Anonymous** (guests use anonymous sessions; no sign-up screen).
4. **Project settings → Your apps → Web (`</>`)** → register an app → copy the config into `firebase-config.js`.
5. **Firestore → Rules** → paste the contents of `firestore.rules` → **Publish**.
   (Or with the CLI: `npm i -g firebase-tools && firebase login && firebase deploy --only firestore:rules`.)
6. **Project settings → Service accounts → Generate new private key.** Keep this JSON secret. You will paste it into Netlify in step 2.
7. **Create the first owner:** Authentication → Users → **Add user** (your email and password) → copy its **User UID**.
   Firestore → **Start collection** `users` → Document ID = that UID → fields: `name` (string), `email` (string), `role` (string) = `owner`.

## 2. Netlify deployment
1. Put this folder in a GitHub repository (Netlify drag-and-drop does not install function dependencies, so use Git or the CLI).
2. Netlify → **Add new site → Import an existing project** → choose the repo. Build command: *(empty)*. Publish directory: `.`
3. **Site configuration → Environment variables:**
   - `FIREBASE_SERVICE_ACCOUNT` = the whole service-account JSON (paste it as one value)
   - `ANTHROPIC_API_KEY` = your key from console.anthropic.com
   - `ANTHROPIC_MODEL` = optional (default `claude-sonnet-5-5`)
4. **Deploy site.** Then Firebase → Authentication → Settings → **Authorized domains** → add your Netlify domain (and your custom domain later).
5. CLI alternative: `npm i -g netlify-cli && netlify deploy --prod`. Local testing: `netlify dev`.

## 3. First-time use
1. Open `https://YOUR-SITE/#admin` → sign in as the owner.
2. **Hotel info:** fill in name, Wi-Fi, timings, services, facilities, offers, contacts, policies, housekeeping items → Save. (The AI answers only from this.)
3. **Rooms & QR:** add each room number, then print its QR code. Each QR opens `https://YOUR-SITE/#r-<room>`.
4. **Staff:** add reception and staff accounts (email + temporary password). Reception signs in at `/#reception` and assigns requests; staff sign in at `/#staff` and see their own tasks.
5. Test: open a room link on a phone, send a housekeeping request, then watch it appear in reception.

## What the security rules enforce
- Guests (anonymous sessions) can read hotel info and the room list, create requests only for rooms that exist, and read only the requests and chat created by their own session. They cannot read other rooms' requests, staff data, or any staff page.
- Staff accounts are created only by the owner through the backend; the browser cannot create or change roles.
- Reception/owner can assign and update requests; staff can only mark their own assigned tasks.
- Only the owner can edit hotel info and rooms.

## Known limits (please read)
- Because there is no access code, anyone who knows a room number can open that room's page and send requests for it. They still cannot see anyone else's data. For stronger protection, enable **Firebase App Check** and add per-room secret tokens later.
- Hotel info (including the Wi-Fi password) is public to anyone who can reach the site. Do not store anything private there.
- The AI endpoint is rate-limited per guest session on a best-effort basis. Set a spending limit in the Anthropic console.
- Chats are stored per guest session, so a guest who clears their browser starts a fresh chat.

## Capacity (400+ guests) — nothing to change in code
There is no "user limit" setting in this app or in Firebase Authentication. Anonymous guest sessions and staff accounts are not capped by the code. What limits you is the plan quotas:
- **Firebase Spark (free):** about 50,000 document reads and 20,000 writes per day. 400 guests opening the page and sending a few requests fits, but busy days with many live updates can reach it. Switching to the **Blaze** plan (pay as you go, still free up to the same quota) removes the hard stop; set a **budget alert** in Google Cloud.
- **Netlify free:** 125,000 function calls per month and 100 GB bandwidth. Enough for 400 guests; AI chat calls count here.
- **Anthropic:** each AI reply costs money; set a monthly spending limit in the Anthropic console.
After hosting once, you do not need to edit code to add rooms, staff or hotel info. Do all of that from `/#admin`.

## Owner analytics
`/#admin` → **Analytics**: choose Daily (14 days), Weekly (8 weeks) or Monthly (6 months). Shows requests received, completed, pending, rejected, average time to complete, guest chat messages, a requests-over-time chart, and breakdowns by type, room, staff and item. Completion time is recorded from the moment a request is marked complete, so it starts filling in after you deploy this version. Remember to re-publish `firestore.rules` (it now allows the `doneAt` field).
