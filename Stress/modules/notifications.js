// =============================================================================
// modules/notifications.js — Group 10: Notifications
// YAML v1.12 endpoints covered:
//   GET    /notifications
//   GET    /notifications/unread-count
//   PATCH  /notifications/mark-read          (was /notifications/mark-all-read — corrected)
//   GET    /notifications/preferences
//   PATCH  /notifications/preferences
//   PATCH  /notifications/{id}/read
//   DELETE /notifications/{id}
//   POST   /notifications/fcm-token          (register fake device token)
//   DELETE /notifications/fcm-token          (unregister — cleanup)
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL } from '../config.js';

export function notificationsModule(token) {
  const auth    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const authOnly= { Authorization: `Bearer ${token}` };

  group('10 Notifications', () => {

    // 10.1 GET /notifications
    const listRes = http.get(`${BASE_URL}/notifications?page=1&limit=20`, { headers: authOnly });
    check(listRes, {
      '[Notifications] list 200':   (r) => r.status === 200,
      '[Notifications] list array': (r) => Array.isArray(r.json('data.notifications')),
    });
    let firstId = null;
    if (listRes.status === 200) {
      const n = listRes.json('data.notifications');
      if (Array.isArray(n) && n.length > 0) firstId = n[0]._id;
    }
    sleep(0.3);

    // 10.2 GET /notifications/unread-count
    const countRes = http.get(`${BASE_URL}/notifications/unread-count`, { headers: authOnly });
    check(countRes, {
      '[Notifications] unreadCount 200':  (r) => r.status === 200,
      '[Notifications] unreadCount >= 0': (r) => r.json('data.unreadCount') >= 0,
    });
    sleep(0.3);

    // 10.3 PATCH /notifications/mark-read — mark ALL as read (corrected path)
    const markAllRes = http.patch(`${BASE_URL}/notifications/mark-read`,
      null, { headers: auth });
    check(markAllRes, { '[Notifications] markAllRead 200': (r) => r.status === 200 });
    sleep(0.3);

    // 10.4 GET /notifications/preferences
    const getPrefsRes = http.get(`${BASE_URL}/notifications/preferences`, { headers: authOnly });
    check(getPrefsRes, {
      '[Notifications] getPrefs 200':    (r) => r.status === 200,
      '[Notifications] getPrefs success':(r) => r.json('success') === true,
    });
    sleep(0.3);

    // 10.5 PATCH /notifications/preferences — toggle a safe, reversible preference
    const patchPrefsRes = http.patch(`${BASE_URL}/notifications/preferences`,
      JSON.stringify({ allowRecommended: true }),
      { headers: auth });
    check(patchPrefsRes, {
      '[Notifications] patchPrefs 200': (r) => r.status === 200,
    });
    sleep(0.3);

    if (firstId) {
      // 10.6 PATCH /notifications/{id}/read — mark single notification as read
      http.patch(`${BASE_URL}/notifications/${firstId}/read`, null, { headers: auth });
      sleep(0.3);

      // 10.7 DELETE /notifications/{id}
      const delRes = http.del(`${BASE_URL}/notifications/${firstId}`, null, { headers: auth });
      check(delRes, {
        '[Notifications] delete 200 or 404': (r) => r.status === 200 || r.status === 404,
      });
    }

    sleep(0.3);
    // 10.8 POST /notifications/fcm-token — register a fake device push token
    const fakeToken = `k6-stress-fcm-${Date.now()}`;
    const regFcmRes = http.post(`${BASE_URL}/notifications/fcm-token`,
      JSON.stringify({ token: fakeToken }),
      { headers: auth });
    check(regFcmRes, {
      '[Notifications] registerFcm 200': (r) => r.status === 200,
    });
    sleep(0.3);
    // 10.9 DELETE /notifications/fcm-token — unregister the token (cleanup)
    const unregFcmRes = http.del(`${BASE_URL}/notifications/fcm-token`,
      JSON.stringify({ token: fakeToken }),
      { headers: auth });
    check(unregFcmRes, {
      '[Notifications] unregisterFcm 200': (r) => r.status === 200,
    });

    sleep(1);
  });
}
