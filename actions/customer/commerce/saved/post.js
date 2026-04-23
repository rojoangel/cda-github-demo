const { instrument, getInstrumentationHelpers } = require("@adobe/aio-lib-telemetry");
const stateLib = require("@adobe/aio-lib-state");
const { STATE_TTL_SECONDS } = require("./pre");

/**
 * Post-processor: records the sync outcome (success or failure) in App Builder State.
 * Key pattern: customer-{customerId} — same key used by pre.js for idempotency checks.
 *
 * @param {object} params - Action params
 * @param {object} transformedData - Transformed customer data
 * @param {object} preProcessed - Result from pre.js ({ skipped, stateKey })
 * @param {object} result - Result from sendData ({ success, statusCode, message? })
 */
async function postProcess(params, transformedData, preProcessed, result) {
  const { currentSpan } = getInstrumentationHelpers();
  currentSpan.addEvent("saved.phase", { value: "postProcess" });

  // If the event was already processed, nothing to record
  if (preProcessed && preProcessed.skipped) {
    return;
  }

  const stateKey = preProcessed?.stateKey ?? `customer-${transformedData.id}`;

  try {
    const state = await stateLib.init();

    const record = {
      status: result.success ? "completed" : "failed",
      customerId: transformedData.id,
      email: transformedData.email,
      syncedAt: new Date().toISOString(),
      erpStatusCode: result.statusCode,
      ...(result.message ? { error: result.message } : {}),
    };

    await state.put(stateKey, record, { ttl: STATE_TTL_SECONDS });

    currentSpan.addEvent("saved.postProcess.stateStored", {
      stateKey,
      status: record.status,
    });
  } catch (err) {
    // Non-fatal: log and continue — the ERP payload was already sent
    currentSpan.addEvent("saved.postProcess.stateError", { message: err.message });
  }
}

module.exports = {
  postProcess: instrument(postProcess),
};
