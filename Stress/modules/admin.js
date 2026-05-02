// =============================================================================
// modules/admin.js — Group 11: Admin
// YAML v1.12 endpoints covered:
//   GET   /admin/stats
//   GET   /admin/stats/daily-users
//   GET   /admin/stats/top-tracks
//   GET   /admin/users
//   GET   /admin/tracks
//   GET   /admin/reports
//   PATCH /admin/reports/{id}/status
//   PATCH /admin/tracks/{id}/hide  + /admin/tracks/{id}/restore  (paired)
//   POST  /admin/users/{id}/warn
//   POST  /admin/broadcast
//   POST  /admin/reports                           (submit report — 201 or 400 on duplicate)
//   PATCH /admin/users/{id}/suspend + /restore     (paired immediately to keep state clean)
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TARGET_USER_ID, TARGET_TRACK_ID } from '../config.js';

export function adminModule(adminToken) {
  const auth = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
  const authOnly = { Authorization: `Bearer ${adminToken}` };

  group('11 Admin', () => {

    // 11.1 GET /admin/stats
    const statsRes = http.get(`${BASE_URL}/admin/stats`, { headers: authOnly });
    check(statsRes, {
      '[Admin] stats 200':          (r) => r.status === 200,
      '[Admin] stats has totalUsers':(r) => r.json('data.totalUsers') !== undefined,
    });
    sleep(0.3);

    // 11.2 GET /admin/stats/daily-users
    const dailyRes = http.get(`${BASE_URL}/admin/stats/daily-users?days=30`, { headers: authOnly });
    check(dailyRes, {
      '[Admin] dailyUsers 200':       (r) => r.status === 200,
      '[Admin] dailyUsers has array': (r) => Array.isArray(r.json('data')),
    });
    sleep(0.3);

    // 11.3 GET /admin/stats/top-tracks
    const topTracksRes = http.get(`${BASE_URL}/admin/stats/top-tracks?limit=10`, { headers: authOnly });
    check(topTracksRes, {
      '[Admin] topTracks 200':       (r) => r.status === 200,
      '[Admin] topTracks has array': (r) => Array.isArray(r.json('data')),
    });
    sleep(0.3);

    // 11.4 GET /admin/users
    const usersRes = http.get(
      `${BASE_URL}/admin/users?page=1&limit=20&status=Active`,
      { headers: authOnly });
    check(usersRes, { '[Admin] userList 200': (r) => r.status === 200 });
    sleep(0.3);

    // 11.5 GET /admin/tracks
    const tracksRes = http.get(
      `${BASE_URL}/admin/tracks?page=1&limit=20&status=Published`,
      { headers: authOnly });
    check(tracksRes, { '[Admin] trackList 200': (r) => r.status === 200 });
    sleep(0.3);

    // 11.6 GET /admin/reports
    const reportsRes = http.get(
      `${BASE_URL}/admin/reports?page=1&limit=20&status=Pending`,
      { headers: authOnly });
    check(reportsRes, { '[Admin] reports 200': (r) => r.status === 200 });

    // Capture a report ID to test status update
    let reportId = null;
    if (reportsRes.status === 200) {
      const reports = reportsRes.json('data');
      if (Array.isArray(reports) && reports.length > 0) reportId = reports[0]._id;
    }
    sleep(0.3);

    // 11.7 PATCH /admin/reports/{id}/status  ← NEW from v1.12
    if (reportId) {
      const resolveRes = http.patch(
        `${BASE_URL}/admin/reports/${reportId}/status`,
        JSON.stringify({ status: 'Reviewed' }),
        { headers: auth });
      check(resolveRes, {
        '[Admin] resolveReport 200 or 404': (r) => r.status === 200 || r.status === 404,
      });
      sleep(0.3);
    }

    // 11.8 PATCH /admin/tracks/{id}/hide  ← NEW from v1.12
    // Then restore immediately — paired to avoid leaving the seeded track hidden.
    const hideRes = http.patch(
      `${BASE_URL}/admin/tracks/${TARGET_TRACK_ID}/hide`,
      null, { headers: auth });
    check(hideRes, {
      '[Admin] hideTrack 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    sleep(0.3);

    const restoreTrackRes = http.patch(
      `${BASE_URL}/admin/tracks/${TARGET_TRACK_ID}/restore`,
      null, { headers: auth });
    check(restoreTrackRes, {
      '[Admin] restoreTrack 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    sleep(0.3);

    // 11.9 POST /admin/users/{id}/warn
    const warnRes = http.post(
      `${BASE_URL}/admin/users/${TARGET_USER_ID}/warn`,
      JSON.stringify({ message: 'k6 stress test warning — automated, please ignore.' }),
      { headers: auth });
    check(warnRes, { '[Admin] warnUser 200': (r) => r.status === 200 });
    sleep(0.3);

    // 11.10 POST /admin/broadcast
    const broadcastRes = http.post(`${BASE_URL}/admin/broadcast`,
      JSON.stringify({ message: 'k6 stress test broadcast — automated, please ignore.' }),
      { headers: auth });
    check(broadcastRes, { '[Admin] broadcast 200': (r) => r.status === 200 });

    sleep(0.3);
    // 11.11 POST /admin/reports — submit a report (201 first call; 400 on duplicate)
    const submitReportRes = http.post(`${BASE_URL}/admin/reports`,
      JSON.stringify({ targetType: 'Track', targetId: TARGET_TRACK_ID, reason: 'Spam' }),
      { headers: auth });
    check(submitReportRes, {
      '[Admin] submitReport 201 or 400': (r) => r.status === 201 || r.status === 400,
    });
    sleep(0.3);
    // 11.12 PATCH /admin/users/{id}/suspend — paired immediately with restore
    const suspendRes = http.patch(
      `${BASE_URL}/admin/users/${TARGET_USER_ID}/suspend`,
      null, { headers: auth });
    check(suspendRes, {
      '[Admin] suspend 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    sleep(0.3);
    // 11.13 PATCH /admin/users/{id}/restore — always called to keep state clean
    const restoreRes = http.patch(
      `${BASE_URL}/admin/users/${TARGET_USER_ID}/restore`,
      null, { headers: auth });
    check(restoreRes, {
      '[Admin] restore 200 or 400': (r) => r.status === 200 || r.status === 400,
    });

    sleep(1);
  });
}
