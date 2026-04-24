/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const crypto = require("crypto");

/** Allowed Commerce event types for this handler */
const ALLOWED_EVENT_TYPES = new Set([
  "observer.sales_order_save_commit_after",
  "com.adobe.commerce.observer.sales_order_save_commit_after",
]);

/** Maximum age of an accepted event (5 minutes in milliseconds) */
const MAX_EVENT_AGE_MS = 5 * 60 * 1000;

/**
 * Validates an inbound Commerce event.
 *
 * Checks (in order):
 * 1. HMAC-SHA256 signature on the raw event body
 * 2. Timestamp replay guard (event must be within 5 minutes)
 * 3. Event type whitelist
 * 4. Required payload fields (id, increment_id)
 *
 * @param {object} params - Full action params including headers, body, and env vars
 * @returns {{ success: boolean, message?: string }}
 */
function validateData(params) {
  const {
    COMMERCE_EVENTING_HMAC_SECRET,
    __ow_headers: headers = {},
    __ow_body: rawBody,
    data,
  } = params;

  // --- 1. HMAC-SHA256 signature check ---
  if (COMMERCE_EVENTING_HMAC_SECRET) {
    const signature = headers["x-adobe-signature"] || headers["x-signature"] || "";
    if (!signature) {
      return { success: false, message: "Missing event signature header" };
    }

    const bodyToSign =
      typeof rawBody === "string"
        ? rawBody
        : JSON.stringify(data || {});

    const expectedSignature = crypto
      .createHmac("sha256", COMMERCE_EVENTING_HMAC_SECRET)
      .update(bodyToSign)
      .digest("hex");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { success: false, message: "Invalid event signature" };
    }
  }

  // --- 2. Timestamp replay guard ---
  const eventTimestamp =
    headers["x-adobe-event-timestamp"] ||
    headers["x-event-timestamp"] ||
    (data && data.timestamp);

  if (eventTimestamp) {
    const eventTime = new Date(eventTimestamp).getTime();
    const now = Date.now();
    if (Number.isNaN(eventTime) || Math.abs(now - eventTime) > MAX_EVENT_AGE_MS) {
      return {
        success: false,
        message: `Event timestamp is outside the allowed 5-minute window`,
      };
    }
  }

  // --- 3. Event type whitelist ---
  const eventType =
    headers["x-adobe-event-type"] ||
    (data && data.type) ||
    "";

  if (eventType && !ALLOWED_EVENT_TYPES.has(eventType)) {
    return {
      success: false,
      message: `Event type '${eventType}' is not allowed by this handler`,
    };
  }

  // --- 4. Required payload fields ---
  if (!data) {
    return { success: false, message: "Missing event data payload" };
  }

  const value = data.value || data;
  if (!value.id && value.id !== 0) {
    return { success: false, message: "Missing required field: id" };
  }
  if (!value.increment_id) {
    return { success: false, message: "Missing required field: increment_id" };
  }

  return { success: true };
}

module.exports = { validateData, ALLOWED_EVENT_TYPES, MAX_EVENT_AGE_MS };
