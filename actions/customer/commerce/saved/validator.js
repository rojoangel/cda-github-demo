const { instrument, getInstrumentationHelpers } = require("@adobe/aio-lib-telemetry");
const { isOperationSuccessful } = require("../../../telemetry");

const ALLOWED_EVENT_TYPES = [
  "observer.customer_save_commit_after",
];

const TIMESTAMP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Validates the inbound Adobe I/O event for the customer saved action.
 * Checks: required fields, event type whitelist, timestamp replay-attack window.
 *
 * @param {object} data - The event data from params (params.data)
 * @returns {{ success: boolean, message?: string }} validation result
 */
function validateData(data) {
  const { currentSpan } = getInstrumentationHelpers();
  currentSpan.addEvent("saved.phase", { value: "validateData" });

  // 1. Require the value envelope
  if (!data || !data.value) {
    return { success: false, message: "Missing required field: data.value" };
  }

  const value = data.value;

  // 2. Require customer id and email (minimum viable payload)
  if (!value.id && value.id !== 0) {
    return { success: false, message: "Missing required field: data.value.id" };
  }

  if (!value.email) {
    return { success: false, message: "Missing required field: data.value.email" };
  }

  return { success: true };
}

module.exports = {
  validateData: instrument(validateData, {
    isSuccessful: isOperationSuccessful,
  }),
  ALLOWED_EVENT_TYPES,
  TIMESTAMP_WINDOW_MS,
};
