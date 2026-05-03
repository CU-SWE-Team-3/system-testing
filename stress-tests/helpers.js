// =============================================================================
// helpers.js — Shared Utility Functions
// =============================================================================
// Import these into any module file. Never copy-paste these functions.
// If the API changes auth format, fix it here once — all modules update.
// =============================================================================

import http from "k6/http";

// ─── Auth Header Builder ──────────────────────────────────────────────────────
/**
 * Returns a headers object with Bearer token auth + JSON content type.
 * Used by every authenticated request across all modules.
 *
 * @param {string} token - The JWT access token from setup().
 * @returns {object} k6 params object with headers.
 */
export function authHeaders(token) {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
}

// ─── Safe JSON Parser ─────────────────────────────────────────────────────────
/**
 * Safely parses a k6 HTTP response body.
 * Returns null instead of throwing if the body isn't valid JSON.
 * Always use this instead of JSON.parse(res.body) directly.
 *
 * @param {object} response - A k6 HTTP response object.
 * @returns {object|null}
 */
export function parseJson(response) {
  try {
    return JSON.parse(response.body);
  } catch (_) {
    return null;
  }
}

// ─── Unique User Generator ────────────────────────────────────────────────────
/**
 * Generates a unique email + displayName for signup stress tests.
 * Uses timestamp + random number to avoid collisions across VUs.
 *
 * @returns {{ email: string, displayName: string }}
 */
export function generateUniqueUser() {
  const ts  = Date.now();
  const rnd = Math.floor(Math.random() * 99999);
  return {
    email:       `vu-${ts}-${rnd}@biobeats-stress.com`,
    displayName: `StressVU ${rnd}`,
  };
}

// ─── Random Array Picker ──────────────────────────────────────────────────────
/**
 * Returns a random element from an array.
 * Used throughout modules to vary request payloads realistically.
 *
 * @param {Array} arr
 * @returns {*}
 */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Random Integer in Range ──────────────────────────────────────────────────
/**
 * Returns a random integer between min and max (inclusive).
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
