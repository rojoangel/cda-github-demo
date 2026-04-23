const { instrument, getInstrumentationHelpers } = require("@adobe/aio-lib-telemetry");
const { isOperationSuccessful } = require("../../../telemetry");

const MAX_RETRIES = 3;
// Base delay in ms; actual delay = BASE_DELAY_MS * 2^(attempt-1)
// Attempts: 1 → 1 s, 2 → 2 s, 3 → 4 s
const BASE_DELAY_MS = 1000;

/**
 * Waits for a given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends the transformed customer payload to the ERP endpoint via HTTP POST.
 * Implements exponential-backoff retry: up to 3 attempts (1 s → 2 s → 4 s).
 *
 * @param {object} params - Action params; must include ERP_API_URL
 * @param {object} data - Transformed customer data
 * @param {object} preProcessed - Result from pre.js ({ skipped, stateKey })
 * @returns {{ success: boolean, statusCode?: number, message?: string }}
 */
async function sendData(params, data, preProcessed) {
  const { currentSpan } = getInstrumentationHelpers();
  currentSpan.addEvent("saved.phase", { value: "sendData" });

  if (preProcessed && preProcessed.skipped) {
    currentSpan.addEvent("saved.sendData.skipped", { customerId: String(data.id) });
    return { success: true, skipped: true };
  }

  const erpUrl = params.ERP_API_URL;
  if (!erpUrl) {
    return { success: false, statusCode: 500, message: "Missing ERP_API_URL parameter" };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      currentSpan.addEvent("saved.sendData.attempt", {
        attempt: String(attempt),
        customerId: String(data.id),
      });

      const response = await fetch(erpUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        currentSpan.addEvent("saved.sendData.success", {
          customerId: String(data.id),
          statusCode: String(response.status),
        });
        return { success: true, statusCode: response.status };
      }

      lastError = new Error(
        `ERP responded with non-2xx status ${response.status} for customer ${data.id}`,
      );

      currentSpan.addEvent("saved.sendData.nonOk", {
        attempt: String(attempt),
        statusCode: String(response.status),
        customerId: String(data.id),
      });
    } catch (err) {
      lastError = err;
      currentSpan.addEvent("saved.sendData.error", {
        attempt: String(attempt),
        error: err.message,
        customerId: String(data.id),
      });
    }

    if (attempt < MAX_RETRIES) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }
  }

  return {
    success: false,
    statusCode: 502,
    message: `ERP sync failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
  };
}

module.exports = {
  sendData: instrument(sendData, {
    isSuccessful: isOperationSuccessful,
  }),
  MAX_RETRIES,
  BASE_DELAY_MS,
};
