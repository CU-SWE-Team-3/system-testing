// =============================================================================
// modules/messages.js — Module 9: Messaging & Track Sharing
// =============================================================================
// Endpoints tested:
//   POST  /messages                              — Send a direct message
//   GET   /messages/conversations                — List all conversations
//   GET   /messages/conversations/:id/messages  — Fetch messages in a conversation
//   PATCH /messages/conversations/:id/read      — Mark all messages as read
//
// IMPORTANT: The messaging module also triggers Socket.IO events server-side
// (receive_message, messages_delivered, messages_read). k6 does not support
// WebSocket event assertion natively, so we only test the REST layer here.
// For Socket.IO stress testing, use a separate k6 websocket script or artillery.
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { authHeaders, parseJson, pick } from "../helpers.js";

const MESSAGE_TEXTS = [
  "Hey, check out this track!",
  "What do you think of the new drop?",
  "Loved your latest upload 🔥",
  "Can we collab sometime?",
  "This beat is crazy",
];

export function messagesModule(data) {
  group("9 Messages", function () {

    // ── 9a. POST Send Message ─────────────────────────────────────────────────
    // Sends a DM to the target user. Side effects:
    //   - Creates or un-hides a Conversation document.
    //   - If recipient is online, upgrades to "delivered" and emits socket event.
    //   - Increments unreadCount on the Conversation for the recipient.
    //   - Sends a MESSAGE notification.
    // 400 = cannot message yourself, 403 = blocked.
    const sendRes = http.post(
      `${data.baseUrl}/messages`,
      JSON.stringify({
        receiverId: data.targetUserId,
        content:    pick(MESSAGE_TEXTS),
      }),
      authHeaders(data.token)
    );
    check(sendRes, {
      // 201 = sent, 400/403 = business rule violation (not a server error)
      "Messages | Send: status 201, 400, or 403": (r) =>
        [201, 400, 403].includes(r.status),
      "Messages | Send: response < 700ms":        (r) => r.timings.duration < 700,
    });

    // ── Correlate: extract conversationId from the sent message ──────────────
    const sentBody    = parseJson(sendRes);
    const convId      = sentBody?.data?.message?.conversationId
      || data.conversationId
      || null;
    sleep(1);

    // ── 9b. GET Conversations List ────────────────────────────────────────────
    // Lists all conversations the user is a participant in.
    // Stresses the join between Conversation and Message collections.
    const listRes = http.get(
      `${data.baseUrl}/messages/conversations?page=1&limit=20`,
      authHeaders(data.token)
    );
    check(listRes, {
      "Messages | List Convs: status 200":       (r) => r.status === 200,
      "Messages | List Convs: response < 600ms": (r) => r.timings.duration < 600,
    });
    sleep(1);

    // ── 9c. GET Messages in Conversation ──────────────────────────────────────
    // Only runs if we have a valid conversationId.
    if (convId) {
      const msgsRes = http.get(
        `${data.baseUrl}/messages/conversations/${convId}/messages?page=1&limit=50`,
        authHeaders(data.token)
      );
      check(msgsRes, {
        "Messages | GET Messages: status 200":       (r) => r.status === 200,
        "Messages | GET Messages: response < 600ms": (r) => r.timings.duration < 600,
      });
      sleep(1);

      // ── 9d. PATCH Mark as Read ───────────────────────────────────────────────
      // Marks all delivered messages in the conversation as read.
      // Triggers the `messages_read` Socket.IO event to the sender.
      const readRes = http.patch(
        `${data.baseUrl}/messages/conversations/${convId}/read`,
        null,
        authHeaders(data.token)
      );
      check(readRes, {
        "Messages | Mark Read: status 200":       (r) => r.status === 200,
        "Messages | Mark Read: response < 500ms": (r) => r.timings.duration < 500,
      });
    }
    sleep(2);
  });
}
