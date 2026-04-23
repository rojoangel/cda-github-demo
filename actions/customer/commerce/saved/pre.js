const { instrument, getInstrumentationHelpers } = require("@adobe/aio-lib-telemetry");
const stateLib = require("@adobe/aio-lib-state");

const STATE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Pre-processor: checks App Builder State for a duplicate-event idempotency key.
 * Key pattern: customer-{customerId}
 *
 * If a record exists with status "completed" the event can be skipped.
 * Returns an object that is forwarded to sendData and postProcess.
 *
 * @param {object} params - Action params (contains LOG_LEVEL)
 * @param {object} transformedData - Transformed customer data
 * @returns {{ skipped: boolean, stateKey: string, alreadyProcessed?: boolean }}
 */
async function preProcess(params, transformedData) {
  const { currentSpan } = getInstrumentationHelpers();
  currentSpan.addEvent("saved.phase", { value: "preProcess" });

  const stateKey = `customer-${transformedData.id}`;

  try {
    const state = await stateLib.init();
    const existing = await state.get(stateKey);

    if (existing && existing.value && existing.value.status === "completed") {
      return { skipped: true, stateKey, alreadyProcessed: true };
    }
  } catch (err) {
    // State lookup failures are non-fatal — proceed with processing
    // to avoid blocking the ERP sync on a transient storage error.
    const { currentSpan: span } = getInstrumentationHelpers();
    span.addEvent("saved.preProcess.stateError", { message: err.message });
  }

  return { skipped: false, stateKey };
}

module.exports = {
  preProcess: instrument(preProcess),
  STATE_TTL_SECONDS,
};
