// =============================================================================
// modules/profile.js — Group 2: Profile
// YAML v1.12 endpoints covered:
//   GET    /profile/{permalink}
//   PATCH  /profile/update
//   PATCH  /profile/privacy
//   PATCH  /profile/social-links
//   DELETE /profile/social-links/{linkId}
//   PATCH  /profile/tier
//   PATCH  /profile/upload-images    (multipart avatar upload)
//   GET    /profile/{userId}/tracks
//   GET    /profile/{userId}/likes
//   GET    /profile/{userId}/reposts
// NOTE: GET /profile/me is NOT in the v1.12 YAML spec — uses TEST_PERMALINK from config.
// NOTE: /profile/tier is Admin-only in production; test expects 200 or 403.
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import encoding from 'k6/encoding';
import { BASE_URL, TARGET_USER_ID, TEST_PERMALINK } from '../config.js';

// Smallest valid 1×1 PNG for multipart upload tests
const TINY_PNG = encoding.b64decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'std', 'b'
);

export function profileModule(token) {
  const auth    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const authOnly= { Authorization: `Bearer ${token}` };

  group('2 Profile', () => {

    // 2.1 GET /profile/{permalink}
    const profileRes = http.get(`${BASE_URL}/profile/${TEST_PERMALINK}`, { headers: authOnly });
    check(profileRes, {
      '[Profile] byPermalink 200':      (r) => r.status === 200,
      '[Profile] byPermalink has role': (r) => r.json('data.user.role') !== undefined,
    });
    sleep(0.3);

    // 2.2 PATCH /profile/update
    const patchRes = http.patch(`${BASE_URL}/profile/update`,
      JSON.stringify({ bio: 'Stress testing', genres: ['Electronic'], city: 'Cairo', country: 'Egypt' }),
      { headers: auth });
    check(patchRes, {
      '[Profile] update 200':    (r) => r.status === 200,
      '[Profile] update success':(r) => r.json('success') === true,
    });
    sleep(0.3);

    // 2.3 PATCH /profile/privacy
    const privRes = http.patch(`${BASE_URL}/profile/privacy`,
      JSON.stringify({ isPrivate: false }), { headers: auth });
    check(privRes, {
      '[Profile] privacy 200':    (r) => r.status === 200,
      '[Profile] privacy success':(r) => r.json('success') === true,
    });
    sleep(0.3);

    // 2.4 PATCH /profile/social-links
    const socialRes = http.patch(`${BASE_URL}/profile/social-links`,
      JSON.stringify({
        socialLinks: [{ platform: 'twitter', url: 'https://twitter.com/k6stress' }]
      }),
      { headers: auth });
    check(socialRes, {
      '[Profile] social-links 200':    (r) => r.status === 200,
      '[Profile] social-links success':(r) => r.json('success') === true,
    });

    let linkId = null;
    if (socialRes.status === 200) {
      const links = socialRes.json('data.socialLinks');
      if (Array.isArray(links) && links.length > 0) linkId = links[0]._id;
    }
    sleep(0.3);

    // 2.5 DELETE /profile/social-links/{linkId}
    if (linkId) {
      const delSocialRes = http.del(`${BASE_URL}/profile/social-links/${linkId}`,
        null, { headers: auth });
      check(delSocialRes, {
        '[Profile] del-social-link 200': (r) => r.status === 200,
      });
      sleep(0.3);
    }

    // 2.6 PATCH /profile/tier — Admin-only in production; test user expects 200 or 403
    const tierRes = http.patch(`${BASE_URL}/profile/tier`,
      JSON.stringify({ role: 'Listener' }), { headers: auth });
    check(tierRes, {
      '[Profile] tier 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
    // Restore to Artist if tier switch succeeded
    if (tierRes.status === 200) {
      http.patch(`${BASE_URL}/profile/tier`,
        JSON.stringify({ role: 'Artist' }), { headers: auth });
    }
    sleep(0.3);

    // 2.7 GET /profile/{userId}/tracks
    const tracksRes = http.get(
      `${BASE_URL}/profile/${TARGET_USER_ID}/tracks?page=1&limit=10`,
      { headers: authOnly });
    check(tracksRes, { '[Profile] userTracks 200': (r) => r.status === 200 });
    sleep(0.3);

    // 2.8 GET /profile/{userId}/likes
    const likesRes = http.get(
      `${BASE_URL}/profile/${TARGET_USER_ID}/likes?page=1&limit=10`,
      { headers: authOnly });
    check(likesRes, { '[Profile] userLikes 200': (r) => r.status === 200 });
    sleep(0.3);

    // 2.9 GET /profile/{userId}/reposts
    const repostsRes = http.get(
      `${BASE_URL}/profile/${TARGET_USER_ID}/reposts?page=1&limit=10`,
      { headers: authOnly });
    check(repostsRes, { '[Profile] userReposts 200': (r) => r.status === 200 });

    sleep(0.3);
    // 2.10 PATCH /profile/upload-images — multipart avatar upload
    const uploadImgRes = http.patch(`${BASE_URL}/profile/upload-images`, {
      avatar: http.file(TINY_PNG, 'avatar.png', 'image/png'),
    }, { headers: { Authorization: `Bearer ${token}` } });
    check(uploadImgRes, {
      '[Profile] upload-images 200': (r) => r.status === 200,
    });

    sleep(1);
  });
}
