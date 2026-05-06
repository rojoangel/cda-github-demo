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

const EVENT_NAME = "observer.sales_order_save_commit_after";
const FIVE_MINUTES = 5 * 60 * 1000;

function getHeader(headers, name) {
  if (!headers) {
    return undefined;
  }

  const lowerName = name.toLowerCase();
  return headers[name] || headers[lowerName] || headers[name.toUpperCase()];
}

function parseTimestamp(value) {
  if (value === undefined || value === null || value === "") {
    return NaN;
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? NaN : parsed;
}

function validateSignature({ payload, headers, secret }) {
  if (!secret) {
    return {
      success: false,
      statusCode: 500,
      message: "Missing webhook secret",
    };
  }

  const signature = getHeader(headers, "x-adobe-signature");
  if (!signature) {
    return {
      success: false,
      statusCode: 401,
      message: "Missing signature header",
    };
  }

  const body = JSON.stringify(payload ?? {});
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const receivedBuffer = Buffer.from(String(signature));
  const expectedBuffer = Buffer.from(expectedSignature);
  const isValid =
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

  if (!isValid) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid signature",
    };
  }

  return {
    success: true,
  };
}

function validateTimestamp(payload, now = Date.now()) {
  const timestamp = parseTimestamp(payload?.created_at ?? payload?.timestamp);

  if (!Number.isFinite(timestamp)) {
    return {
      success: false,
      statusCode: 400,
      message: "Missing timestamp",
    };
  }

  if (now - timestamp > FIVE_MINUTES) {
    return {
      success: false,
      statusCode: 401,
      message: "Expired timestamp",
    };
  }

  return {
    success: true,
  };
}

function validateEventType(payload) {
  const eventName = payload?.event?.name || payload?.name || EVENT_NAME;

  if (eventName !== EVENT_NAME) {
    return {
      success: false,
      statusCode: 400,
      message: `Unsupported event type: ${eventName}`,
    };
  }

  return {
    success: true,
  };
}

function validateData({ payload, headers, secret, now = Date.now() }) {
  const eventTypeValidation = validateEventType(payload);
  if (!eventTypeValidation.success) {
    return eventTypeValidation;
  }

  const timestampValidation = validateTimestamp(payload, now);
  if (!timestampValidation.success) {
    return timestampValidation;
  }

  return validateSignature({ payload, headers, secret });
}

module.exports = {
  EVENT_NAME,
  validateData,
  validateEventType,
  validateSignature,
  validateTimestamp,
};
