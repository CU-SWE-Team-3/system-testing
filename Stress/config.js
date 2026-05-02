// =============================================================================
// config.js — BioBeats K6 Stress Test Configuration
// =============================================================================

export const BASE_URL = __ENV.BASE_URL || "http://localhost:5000/api";

export const TEST_EMAIL      = __ENV.TEST_EMAIL      || "soundcloud.testing.e2e@gmail.com";
export const TEST_PASSWORD   = __ENV.TEST_PASSWORD   || "TestPass2!";
export const TEST_PERMALINK  = __ENV.TEST_PERMALINK  || "e2e-tester";

export const TARGET_USER_ID          = __ENV.TARGET_USER_ID          || "69cefcfca47de9fd5a6da727";
export const TARGET_TRACK_ID         = __ENV.TARGET_TRACK_ID         || "69cffa194d0969c445881a5d";
export const TARGET_TRACK_PERMALINK  = __ENV.TARGET_TRACK_PERMALINK  || "my-track12";
export const TARGET_PLAYLIST_ID      = __ENV.TARGET_PLAYLIST_ID      || "69ea6e5679ba6666d7b0048a";
export const TARGET_CONVERSATION_ID  = __ENV.TARGET_CONVERSATION_ID  || "";

export const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL    || "mohammed12hoss34@gmail.com";
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "Password123!";

export const TEST_CAPTCHA_TOKEN = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

// ─── Stress Test Stages ───────────────────────────────────────────────────────
export const STRESS_STAGES = [
  { duration: "2m", target: 50  },
  { duration: "3m", target: 50  },
  { duration: "2m", target: 100 },
  { duration: "1m", target: 0   },
];

export const QUICK_STAGES = [
  { duration: "1m", target: 20 },
  { duration: "1m", target: 20 },
  { duration: "1m", target: 0  },
];

// ─── Global Thresholds ────────────────────────────────────────────────────────
export const THRESHOLDS = {
  http_req_failed:                               ["rate<0.01"],
  http_req_duration:                             ["p(95)<800"],
  "http_req_duration{group:::1 Auth}":           ["p(95)<600"],
  "http_req_duration{group:::2 Profile}":        ["p(95)<500"],
  "http_req_duration{group:::3 Network}":        ["p(95)<600"],
  "http_req_duration{group:::4 Tracks}":         ["p(95)<1000"],
  "http_req_duration{group:::5 Playback}":       ["p(95)<700"],
  "http_req_duration{group:::6 Engagement}":     ["p(95)<600"],
  "http_req_duration{group:::7 Playlists}":      ["p(95)<600"],
  "http_req_duration{group:::8 Discovery}":      ["p(95)<500"],
  "http_req_duration{group:::9 Messages}":       ["p(95)<700"],
  "http_req_duration{group:::10 Notifications}": ["p(95)<500"],
  "http_req_duration{group:::11 Admin}":         ["p(95)<800"],
  "http_req_duration{group:::12 Subscription}":  ["p(95)<800"],
  "http_req_duration{group:::13 Stations}":      ["p(95)<500"],
};
