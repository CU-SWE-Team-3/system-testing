// =============================================================================
// modules/notifications.js — Module 10: Real-Time Notifications
// =============================================================================
// Endpoints tested:
//   GET   /notifications           — Fetch notification feed
//   GET   /notifications/unread-count — Get unread badge count
//   PATCH /notifications/mark-read — Mark ALL notifications as read
//
// NOTE: Notifications are also delivered in real-time via Socket.IO
// (new_notification, notification_read, all_notifications_read events).
// This module only stresses the REST polling layer.
// The engagement and network modules indirectly stress notification creation
// because every like, comment, repost, and follow creates a notification.
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { authHeaders, parseJson } from "../helpers.js";

export function notificationsModule(data) {
  group("10 Notifications", function () {

    // ── 10a. FCM Stub Token Cleanup ───────────────────────────────────────────
    // FIX: The test user accounts in MongoDB contain placeholder FCM tokens
    // ('stub-fcm-token-replace-with-firebase', 'test_dummy_token_12345').
    // Every like, comment, repost, follow, and message in the test triggers a
    // Firebase push notification, which fails against these dead tokens and
    // floods the backend logs with "[Firebase] Dead tokens found".
    //
    // YAML: DELETE /notifications/fcm-token accepts { token: string } and
    // removes it from the authenticated user's token list using $pull semantics.
    // Sending a token that isn't registered is a no-op (no error).
    const STUB_TOKENS = [
      "stub-fcm-token-replace-with-firebase",
      "test_dummy_token_12345",
    ];
    for (const stubToken of STUB_TOKENS) {
      http.del(
        `${data.baseUrl}/notifications/fcm-token`,
        JSON.stringify({ token: stubToken }),
        authHeaders(data.token)
      );
      // No check needed — 200 means removed, any other status means it wasn't
      // there. Either way the noise stops. No sleep to keep it fast.
    }

    // ── 10b. GET Unread Count ─────────────────────────────────────────────────
    // Lightweight query used to update the notification badge in the UI.
    // Called very frequently (on every page load in most app implementations).
    const countRes = http.get(
      `${data.baseUrl}/notifications/unread-count`,
      authHeaders(data.token)
    );
    check(countRes, {
      "Notifications | Unread Count: status 200":      (r) => r.status === 200,
      "Notifications | Unread Count: response < 300ms":(r) => r.timings.duration < 300,
    });
    sleep(1);

    // ── 10c. GET Notification Feed ────────────────────────────────────────────
    // Fetches the paginated notification list. Stresses the lookup against
    // the Notifications collection with population of actor user data.
    const feedRes = http.get(
      `${data.baseUrl}/notifications?page=1&limit=20`,
      authHeaders(data.token)
    );
    check(feedRes, {
      "Notifications | Feed: status 200":       (r) => r.status === 200,
      "Notifications | Feed: response < 500ms": (r) => r.timings.duration < 500,
    });
    sleep(1);

    // ── 10d. PATCH Mark All as Read ───────────────────────────────────────────
    // Bulk-updates all unread notifications to isRead: true.
    // Also triggers the `all_notifications_read` Socket.IO event for multi-device sync.
    // 200 with updatedCount: 0 is valid when all are already read.
    const markReadRes = http.patch(
      `${data.baseUrl}/notifications/mark-read`,
      null,
      authHeaders(data.token)
    );
    check(markReadRes, {
      "Notifications | Mark All Read: status 200":      (r) => r.status === 200,
      "Notifications | Mark All Read: response < 500ms":(r) => r.timings.duration < 500,
    });
    sleep(2);
  });
}
