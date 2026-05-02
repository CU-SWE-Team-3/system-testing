// =============================================================================
// modules/messages.js — Group 9: Messages
// YAML v1.12 endpoints covered:
//   GET    /messages/conversations
//   POST   /messages                              (send message — creates conversation implicitly)
//   GET    /messages/{conversationId}/messages
//   PATCH  /messages/conversations/{id}/read
//   PATCH  /messages/{messageId}                  (edit message)
//   DELETE /messages/{messageId}/everyone         (delete for all participants)
//   DELETE /messages/{messageId}/me               (delete for sender only)
//   DELETE /messages/conversations/{id}           (hide conversation from inbox)
// NOTE: POST /messages/conversations does NOT exist in v1.12 YAML.
//       Conversations are created implicitly by POST /messages.
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TARGET_USER_ID, TARGET_CONVERSATION_ID } from '../config.js';

export function messagesModule(token) {
  const auth    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const authOnly= { Authorization: `Bearer ${token}` };

  group('9 Messages', () => {

    // 9.1 GET /messages/conversations
    const listRes = http.get(
      `${BASE_URL}/messages/conversations?page=1&limit=10`,
      { headers: authOnly });
    check(listRes, {
      '[Messages] list 200':       (r) => r.status === 200,
      '[Messages] list has array': (r) => Array.isArray(r.json('data.conversations')),
    });
    sleep(0.3);

    // 9.2 POST /messages — send a message (creates conversation implicitly if first contact)
    const sendRes = http.post(`${BASE_URL}/messages`,
      JSON.stringify({
        receiverId: TARGET_USER_ID,
        content:    'k6 stress test message — automated, please ignore.',
      }),
      { headers: auth });
    check(sendRes, {
      '[Messages] send 201':        (r) => r.status === 201,
      '[Messages] send has msgId':  (r) => r.json('data.message._id') !== undefined,
    });

    let sentMessageId  = null;
    let conversationId = TARGET_CONVERSATION_ID;
    if (sendRes.status === 201) {
      sentMessageId  = sendRes.json('data.message._id');
      conversationId = sendRes.json('data.message.conversationId') || conversationId;
    }
    sleep(0.3);

    if (conversationId) {
      // 9.3 GET /messages/{conversationId}/messages
      const msgsRes = http.get(
        `${BASE_URL}/messages/${conversationId}/messages?page=1&limit=20`,
        { headers: authOnly });
      check(msgsRes, {
        '[Messages] getMessages 200':   (r) => r.status === 200,
        '[Messages] getMessages array': (r) => Array.isArray(r.json('data.messages')),
      });

      let lastMessageId = sentMessageId;
      if (msgsRes.status === 200) {
        const msgs = msgsRes.json('data.messages');
        if (Array.isArray(msgs) && msgs.length > 0) lastMessageId = msgs[0]._id;
      }
      sleep(0.3);

      // 9.4 PATCH /messages/conversations/{id}/read — mark conversation as read
      const readRes = http.patch(
        `${BASE_URL}/messages/conversations/${conversationId}/read`,
        null, { headers: auth });
      check(readRes, {
        '[Messages] markRead 200':    (r) => r.status === 200,
        '[Messages] markRead success':(r) => r.json('success') === true,
      });
      sleep(0.3);

      if (sentMessageId) {
        // 9.5 PATCH /messages/{messageId} — edit the message we just sent
        // Only valid within 15 minutes of sending (always true in stress tests).
        const editRes = http.patch(`${BASE_URL}/messages/${sentMessageId}`,
          JSON.stringify({ content: 'k6 stress test message — edited, please ignore.' }),
          { headers: auth });
        check(editRes, {
          '[Messages] editMessage 200 or 400': (r) => r.status === 200 || r.status === 400,
        });
        sleep(0.3);

        // 9.6 DELETE /messages/{messageId}/everyone — hard-delete for all participants
        const delEveryoneRes = http.del(
          `${BASE_URL}/messages/${sentMessageId}/everyone`,
          null, { headers: auth });
        check(delEveryoneRes, {
          '[Messages] deleteEveryone 200 or 400': (r) =>
            r.status === 200 || r.status === 400,
        });
        sleep(0.3);
      }

      // 9.7 DELETE /messages/{messageId}/me — soft-delete for sender only
      if (lastMessageId && lastMessageId !== sentMessageId) {
        const delForMeRes = http.del(
          `${BASE_URL}/messages/${lastMessageId}/me`,
          null, { headers: auth });
        check(delForMeRes, {
          '[Messages] deleteForMe 200 or 400': (r) =>
            r.status === 200 || r.status === 400,
        });
      }

      // 9.8 DELETE /messages/conversations/{conversationId} — hide from inbox
      const hideConvRes = http.del(
        `${BASE_URL}/messages/conversations/${conversationId}`,
        null, { headers: auth });
      check(hideConvRes, {
        '[Messages] hideConversation 200 or 400': (r) => r.status === 200 || r.status === 400,
      });
      sleep(0.3);
    }

    sleep(1);
  });
}
