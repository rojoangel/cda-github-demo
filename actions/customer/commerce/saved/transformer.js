const { instrument, getInstrumentationHelpers } = require("@adobe/aio-lib-telemetry");

/**
 * Transforms the Adobe Commerce customer event payload into the minimal ERP format.
 * Pure function — no I/O side effects.
 *
 * Commerce payload fields (from events.json sample):
 *   data.value.id          → id
 *   data.value.email       → email
 *   data.value.firstname   → firstName
 *   data.value.lastname    → lastName
 *
 * @param {object} data - The event data object (params.data)
 * @returns {{ id: number, email: string, firstName: string, lastName: string, timestamp: string }}
 */
function transformData(data) {
  const { currentSpan } = getInstrumentationHelpers();
  currentSpan.addEvent("saved.phase", { value: "transformData" });

  const value = data.value;

  return {
    id: value.id,
    email: value.email,
    firstName: value.firstname || "",
    lastName: value.lastname || "",
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  transformData: instrument(transformData),
};
