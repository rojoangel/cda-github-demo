const { telemetryConfig } = require("../../../telemetry");
const { instrumentEntrypoint, getInstrumentationHelpers } = require("@adobe/aio-lib-telemetry");

const { stringParameters } = require("../../../utils");
const { transformData } = require("./transformer");
const { sendData } = require("./sender");
const { HTTP_INTERNAL_ERROR, HTTP_BAD_REQUEST } = require("../../../constants");
const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { postProcess } = require("./post");

const {
  actionSuccessResponse,
  actionErrorResponse,
  isActionSuccessful,
} = require("../../../responses");

/**
 * Orchestrator action for syncing saved customer data from Adobe Commerce to an external ERP.
 * Flow: validate → transform → pre-process (idempotency) → send → post-process (state record)
 *
 * @param {object} params - Includes event data (params.data) and env vars (ERP_API_URL, LOG_LEVEL)
 * @returns response object with status code and body
 */
async function main(params) {
  const { logger } = getInstrumentationHelpers();

  logger.info("Start processing customer saved event");
  logger.debug(`Received params: ${stringParameters(params)}`);

  try {
    logger.debug(`Validate data: ${JSON.stringify(params.data)}`);
    const validation = validateData(params.data);
    if (!validation.success) {
      logger.error(`Validation failed with error: ${validation.message}`);
      return actionErrorResponse(HTTP_BAD_REQUEST, validation.message);
    }

    logger.debug(`Transform data: ${JSON.stringify(params.data)}`);
    const transformedData = transformData(params.data);

    logger.debug(`Preprocess data: customer id=${transformedData.id}`);
    const preProcessed = await preProcess(params, transformedData);

    if (preProcessed.skipped) {
      logger.info(`Customer ${transformedData.id} already processed — skipping ERP sync`);
      return actionSuccessResponse("Customer already synced — skipped duplicate event");
    }

    logger.debug(`Start sending data for customer id=${transformedData.id}`);
    const result = await sendData(params, transformedData, preProcessed);

    logger.debug(`Postprocess data for customer id=${transformedData.id}`);
    await postProcess(params, transformedData, preProcessed, result);

    if (!result.success) {
      logger.error(`Send data failed: ${result.message}`);
      return actionErrorResponse(result.statusCode, result.message);
    }

    logger.debug("Process finished successfully");
    return actionSuccessResponse("Customer saved event synced to ERP successfully");
  } catch (error) {
    logger.error(`Error processing the request: ${error.message}`);
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  }
}

exports.main = instrumentEntrypoint(main, {
  ...telemetryConfig,
  isSuccessful: isActionSuccessful,
});
