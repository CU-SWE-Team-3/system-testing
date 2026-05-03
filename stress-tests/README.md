# BioBeats — K6 Stress Tests

## Folder Structure

```
stress-tests/
├── config.js                  ← ★ THE ONLY FILE YOU EDIT ★
├── helpers.js                 ← Shared utility functions
├── setup.js                   ← Login + teardown lifecycle hooks
│
├── modules/
│   ├── auth.js                ← Module 1:  Auth (signup, login, refresh)
│   ├── profile.js             ← Module 2:  Profile (GET, update, social links)
│   ├── network.js             ← Module 3:  Network (follow, unfollow, followers)
│   ├── tracks.js              ← Module 4:  Tracks (upload init, GET track)
│   ├── playback.js            ← Module 5:  Playback (stream URL, player state, history)
│   ├── engagement.js          ← Module 6:  Engagement (like, comment, repost)
│   ├── playlists.js           ← Module 7:  Playlists (CRUD, track sequencing)
│   ├── discovery.js           ← Module 8:  Discovery (trending, search, feed)
│   ├── messages.js            ← Module 9:  Messages (send, list, mark read)
│   ├── notifications.js       ← Module 10: Notifications (feed, unread, mark all read)
│   └── admin.js               ← Module 11: Admin (platform analytics)
│
├── stress_test_full.js        ← All 11 modules · 8 min · 100 VUs peak
└── stress_test_quick.js       ← 4 hottest modules · 3 min · 20 VUs (CI gate)
```

---

## Before You Run

### Step 1 — Install K6
```bash
# macOS
brew install k6

# Windows (Chocolatey)
choco install k6

# Linux
sudo apt install k6
```

### Step 2 — Edit config.js

Open `config.js` and fill in:

| Variable | What it needs to be |
|---|---|
| `TEST_EMAIL` | Email of your pre-seeded stress-test account |
| `TEST_PASSWORD` | Password of that account |
| `TARGET_USER_ID` | MongoDB `_id` of any other existing user |
| `TARGET_TRACK_ID` | MongoDB `_id` of a public, Finished track |
| `TARGET_PLAYLIST_ID` | MongoDB `_id` of any public playlist |
| `ADMIN_EMAIL` | Email of an Admin-role user (for Module 11) |
| `ADMIN_PASSWORD` | Password of that admin user |

### Step 3 — Seed the Test Account

Create this in MongoDB manually (or via your admin route):
- `isEmailVerified: true` — login is blocked otherwise
- `role: Artist` — required for track uploads
- `subscriptionPlan: Pro` — avoids the 3-track upload limit

### Step 4 — Disable CAPTCHA on your test server

In your backend `.env`:
```
SKIP_CAPTCHA=true
# or
NODE_ENV=test
```

Without this, the `/auth/register` sub-test will always return 400 (which the
script handles gracefully, but signup data will be meaningless).

---

## Running the Tests

```bash
# Full stress test (Phase 4 / pre-release)
k6 run stress_test_full.js

# Quick sanity check (after every backend deploy in Phase 3)
k6 run stress_test_quick.js

# Against staging/production
k6 run -e BASE_URL=https://api.biobeats.com/api stress_test_full.js

# Pass all IDs via CLI (no need to edit config.js)
k6 run \
  -e BASE_URL=https://staging.biobeats.com/api \
  -e TARGET_TRACK_ID=507f1f77bcf86cd799439022 \
  -e TARGET_USER_ID=507f1f77bcf86cd799439044 \
  stress_test_full.js

# With live browser dashboard
k6 run --out dashboard stress_test_full.js
```

---

## What to Look For in the Results

| Metric | Green | Red flag |
|---|---|---|
| `http_req_failed` | < 1% | > 1% — server returning 5xx errors |
| `http_req_duration p(95)` | < 800ms | > 800ms — latency degrading under load |
| Group-specific p(95) | See thresholds in config.js | Any threshold breach = CI fail |
| `biobeats_login_success_rate` | > 99% | Auth service struggling |
| `biobeats_like_success_rate` | > 95% | Write contention on Track documents |
| `biobeats_comment_success_rate` | > 95% | Comment or notification pipeline congestion |

---

## Who Runs What

| Person | Script | When |
|---|---|---|
| Abdelrahman (Mobile QA) | `stress_test_full.js` | Phase 4 freeze period |
| Omar (Web QA) | `stress_test_quick.js` | After each backend deploy in Phase 3 |
| Both together | `stress_test_full.js` simultaneously | Final combined load test — run at the same time to simulate realistic concurrent load |
