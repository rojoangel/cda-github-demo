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
const stateLib = require("@adobe/aio-lib-state");
const { IDEMPOTENCY_KEY_PREFIX } = require("./pre");

/** TTL in seconds for idempotency keys (15 minutes) */
const IDEMPOTENCY_TTL_SECONDS = 900;

/**
 * Post-processing step for the Order → CRM sync flow.
 *
 * On success:  Writes an idempotency key to aio-lib-state with a 15-minute TTL
 *              so rapid re-saves of the same order are deduplicated by pre.js.
 *
 * On failure:  Emits a structured error log entry with increment_id and HTTP status
 *              to support debugging and I/O Events journaling replay.
 *
 * @param {object} params          - Full action params
 * @param {object} transformedData - CRM-shaped order object (must contain increment_id)
 * @param {{ success: boolean, statusCode?: number, message?: string }} sendResult
 *   - Result returned by sender.js
 */
async function postProcess(params, transformedData, sendResult) {
  const logger = Core.Logger("order-crm-post", {
    level: params.LOG_LEVEL || "info",
  });

  const { increment_id } = transformedData;

  if (sendResult && sendResult.success) {
    try {
      const state = await stateLib.init();
      const key = `${IDEMPOTENCY_KEY_PREFIX}.${increment_id}`;
      await state.put(key, "processed", { ttl: IDEMPOTENCY_TTL_SECONDS });
      logger.info(
        `Idempotency key written for order ${increment_id} (TTL ${IDEMPOTENCY_TTL_SECONDS}s)`,
      );
    } catch (stateError) {
      // Non-fatal: log but do not fail the overall action
      logger.warn(
        `Failed to write idempotency key for order ${increment_id}: ${stateError.message}`,
      );
    }
  } else {
    const statusCode = sendResult ? sendResult.statusCode : "unknown";
    const message = sendResult ? sendResult.message : "send result unavailable";
    logger.error(
      JSON.stringify({
        event: "order-crm-sync-failed",
        increment_id,
        http_status: statusCode,
        error: message,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

module.exports = { postProcess, IDEMPOTENCY_TTL_SECONDS };
