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
const { stringParameters } = require("../../../utils");
const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { transformData } = require("./transformer");
const { sendData } = require("./sender");
const { postProcess } = require("./post");
const { HTTP_INTERNAL_ERROR, HTTP_BAD_REQUEST } = require("../../../constants");
const {
  actionSuccessResponse,
  actionErrorResponse,
} = require("../../../responses");

/**
 * Orchestrator for the Order → CRM sync flow.
 * Sequentially calls: validate → pre → transform → send → post.
 *
 * @param {object} params - Includes env params and the Commerce event data
 * @returns {object} Response object with statusCode + body
 */
async function main(params) {
  const logger = Core.Logger("order-crm-order-created", {
    level: params.LOG_LEVEL || "info",
  });

  logger.info("Start processing order CRM sync request");
  logger.debug(`Received params: ${stringParameters(params)}`);

  try {
    // 1. Validate — HMAC signature, timestamp replay guard, event type whitelist
    logger.debug(`Validate data: ${JSON.stringify(params.data)}`);
    const validation = validateData(params);
    if (!validation.success) {
      logger.error(`Validation failed: ${validation.message}`);
      return actionErrorResponse(HTTP_BAD_REQUEST, validation.message);
    }

    // 2. Pre-process — idempotency check
    logger.debug("Running pre-process idempotency check");
    const preResult = await preProcess(params);
    if (preResult && preResult.duplicate) {
      logger.info(
        `Duplicate event detected for increment_id=${preResult.increment_id}. Skipping.`,
      );
      return actionSuccessResponse(
        `Duplicate skipped for order ${preResult.increment_id}`,
      );
    }

    // 3. Transform — map Commerce payload to minimal CRM schema
    logger.debug("Transforming order data for CRM");
    const transformedData = transformData(params.data);

    // 4. Send — POST to CRM endpoint with retry
    logger.debug(`Sending data to CRM: ${JSON.stringify(transformedData)}`);
    const sendResult = await sendData(params, transformedData);
    if (!sendResult.success) {
      logger.error(
        `CRM send failed for increment_id=${transformedData.increment_id}: ${sendResult.message}`,
      );
      return actionErrorResponse(sendResult.statusCode, sendResult.message);
    }

    // 5. Post-process — write idempotency key to state
    logger.debug("Running post-process");
    await postProcess(params, transformedData, sendResult);

    logger.info(
      `Order ${transformedData.increment_id} successfully synced to CRM`,
    );
    return actionSuccessResponse(
      `Order ${transformedData.increment_id} synced to CRM`,
    );
  } catch (error) {
    logger.error(`Unhandled error in order CRM sync: ${error.message}`);
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  }
}

exports.main = main;
