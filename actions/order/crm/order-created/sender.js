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

const { Core } = require("@adobe/aio-sdk");

/** Maximum number of send attempts */
const MAX_RETRIES = 3;

/** Base delay in milliseconds for exponential backoff (doubles each attempt: 1s, 2s, 4s) */
const BASE_DELAY_MS = 1000;

/**
 * Pauses execution for the given number of milliseconds.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POSTs the transformed order payload to the configured CRM endpoint.
 *
 * Retry policy:
 * - 3 attempts total
 * - Exponential backoff: 1 s, 2 s, 4 s between attempts
 * - 4xx responses are treated as non-retryable (bad payload); retry only on 5xx / network errors
 *
 * @param {object} params - Full action params (must contain CRM_ENDPOINT_URL and CRM_API_KEY)
 * @param {object} transformedData - CRM-shaped order object from transformer.js
 * @returns {{ success: boolean, statusCode?: number, message?: string }}
 */
async function sendData(params, transformedData) {
  const logger = Core.Logger("order-crm-sender", {
    level: params.LOG_LEVEL || "info",
  });

  const { CRM_ENDPOINT_URL, CRM_API_KEY } = params;

  if (!CRM_ENDPOINT_URL) {
    return {
      success: false,
      statusCode: 500,
      message: "CRM_ENDPOINT_URL is not configured",
    };
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (CRM_API_KEY) {
    headers["Authorization"] = `Bearer ${CRM_API_KEY}`;
  }

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.debug(
        `CRM POST attempt ${attempt}/${MAX_RETRIES} for order ${transformedData.increment_id}`,
      );

      const response = await fetch(CRM_ENDPOINT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(transformedData),
      });

      if (response.ok) {
        logger.info(
          `CRM POST succeeded (HTTP ${response.status}) for order ${transformedData.increment_id}`,
        );
        return { success: true, statusCode: response.status };
      }

      // 4xx — non-retryable client error
      if (response.status >= 400 && response.status < 500) {
        const body = await response.text().catch(() => "");
        logger.error(
          `CRM POST non-retryable error HTTP ${response.status} for order ${transformedData.increment_id}: ${body}`,
        );
        return {
          success: false,
          statusCode: response.status,
          message: `CRM rejected the request with HTTP ${response.status}: ${body}`,
        };
      }

      // 5xx — retryable server error
      lastError = new Error(`CRM responded with HTTP ${response.status}`);
      logger.warn(
        `CRM POST attempt ${attempt} failed with HTTP ${response.status}. ${attempt < MAX_RETRIES ? "Retrying..." : "No more retries."}`,
      );
    } catch (networkError) {
      lastError = networkError;
      logger.warn(
        `CRM POST attempt ${attempt} threw a network error: ${networkError.message}. ${attempt < MAX_RETRIES ? "Retrying..." : "No more retries."}`,
      );
    }

    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }

  return {
    success: false,
    statusCode: 502,
    message: `CRM POST failed after ${MAX_RETRIES} attempts: ${lastError ? lastError.message : "unknown error"}`,
  };
}

module.exports = { sendData, MAX_RETRIES, BASE_DELAY_MS };
