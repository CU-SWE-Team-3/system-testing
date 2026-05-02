// =============================================================================
// modules/engagement.js — Group 6: Engagement
// UPDATED from Phase3 YAML — ALL paths changed:
//   - POST/DELETE /tracks/{id}/like       (was /interactions/like/track/:id)
//   - POST/DELETE /tracks/{id}/repost     (was /interactions/repost/track/:id)
//   - GET /tracks/{id}/likers             (was /interactions/likers/track/:id)
//   - GET /tracks/{id}/reposters          (was /interactions/reposters/track/:id)
//   - POST/GET /tracks/{trackId}/comments (was /comments and /comments/track/:id)
//   - DELETE /comments/{commentId}        (unchanged)
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TARGET_TRACK_ID } from '../config.js';

export function engagementModule(token) {
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const authOnly = { Authorization: `Bearer ${token}` };

  group('6 Engagement', () => {

    // 6.1 POST /tracks/{id}/like  ← corrected
    const likeRes = http.post(`${BASE_URL}/tracks/${TARGET_TRACK_ID}/like`,
      null, { headers: auth });
    check(likeRes, {
      '[Engagement] like 201 or 400': (r) => r.status === 201 || r.status === 400,
    });
    sleep(0.3);

    // 6.2 DELETE /tracks/{id}/like  ← corrected (cleanup)
    const unlikeRes = http.del(`${BASE_URL}/tracks/${TARGET_TRACK_ID}/like`,
      null, { headers: auth });
    check(unlikeRes, {
      '[Engagement] unlike 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    sleep(0.3);

    // 6.3 POST /tracks/{id}/repost  ← corrected
    const repostRes = http.post(`${BASE_URL}/tracks/${TARGET_TRACK_ID}/repost`,
      null, { headers: auth });
    check(repostRes, {
      '[Engagement] repost 201 or 400': (r) => r.status === 201 || r.status === 400,
    });
    sleep(0.3);

    // 6.4 DELETE /tracks/{id}/repost  ← corrected (cleanup)
    const unrepostRes = http.del(`${BASE_URL}/tracks/${TARGET_TRACK_ID}/repost`,
      null, { headers: auth });
    check(unrepostRes, {
      '[Engagement] unrepost 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    sleep(0.3);

    // 6.5 GET /tracks/{trackId}/comments  ← corrected
    const commentsRes = http.get(
      `${BASE_URL}/tracks/${TARGET_TRACK_ID}/comments?page=1&limit=10`,
      { headers: authOnly });
    check(commentsRes, {
      '[Engagement] getComments 200':  (r) => r.status === 200,
      '[Engagement] getComments array':(r) => Array.isArray(r.json('data.comments')),
    });
    sleep(0.3);

    // 6.6 POST /tracks/{trackId}/comments  ← corrected
    const postCommentRes = http.post(
      `${BASE_URL}/tracks/${TARGET_TRACK_ID}/comments`,
      JSON.stringify({ content: 'k6 stress test comment — auto-deleted', timestamp: 30 }),
      { headers: auth });
    check(postCommentRes, {
      '[Engagement] postComment 201':    (r) => r.status === 201,
      '[Engagement] postComment success':(r) => r.json('success') === true,
    });

    let commentId = null;
    if (postCommentRes.status === 201)
      commentId = postCommentRes.json('data.comment._id') || postCommentRes.json('data._id');
    sleep(0.3);

    // 6.7 DELETE /comments/{commentId}  ← unchanged
    if (commentId) {
      const delCommentRes = http.del(`${BASE_URL}/comments/${commentId}`,
        null, { headers: auth });
      check(delCommentRes, {
        '[Engagement] deleteComment 200 or 204': (r) =>
          r.status === 200 || r.status === 204,
      });
      sleep(0.3);
    }

    // 6.8 GET /tracks/{id}/likers  ← corrected
    const likersRes = http.get(
      `${BASE_URL}/tracks/${TARGET_TRACK_ID}/likers?page=1&limit=10`,
      { headers: authOnly });
    check(likersRes, { '[Engagement] likers 200': (r) => r.status === 200 });
    sleep(0.3);

    // 6.9 GET /tracks/{id}/reposters  ← corrected
    const repostersRes = http.get(
      `${BASE_URL}/tracks/${TARGET_TRACK_ID}/reposters?page=1&limit=10`,
      { headers: authOnly });
    check(repostersRes, { '[Engagement] reposters 200': (r) => r.status === 200 });

    sleep(1);
  });
}
