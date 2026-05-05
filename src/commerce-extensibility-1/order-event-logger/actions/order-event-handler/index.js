const { Core } = require("@adobe/aio-sdk");

function getEventPayload(params) {
  if (params && typeof params.data === "object" && params.data !== null) {
    if (params.data.value && typeof params.data.value === "object") {
      return params.data.value;
    }

    return params.data;
  }

  return params;
}

function validateOrderPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "invalid event payload";
  }

  if (payload.id === undefined || payload.id === null || payload.id === "") {
    return "missing required field: id";
  }

  if (payload.increment_id === undefined || payload.increment_id === null || payload.increment_id === "") {
    return "missing required field: increment_id";
  }

  return null;
}

async function main(params) {
  const logger = Core.Logger("order-event-handler", { level: params.LOG_LEVEL || "info" });

  try {
    const payload = getEventPayload(params);
    const validationError = validateOrderPayload(payload);

    if (validationError) {
      logger.error(validationError);
      return {
        statusCode: 400,
        body: {
          error: validationError,
        },
      };
    }

    logger.info(`Order received: id=${payload.id}, increment_id=${payload.increment_id}`);

    return {
      statusCode: 200,
      body: {
        acknowledged: true,
        orderId: payload.id,
        incrementId: payload.increment_id,
      },
    };
  } catch (error) {
    logger.error(error);

    return {
      statusCode: 500,
      body: {
        error: "unexpected error processing order event",
      },
    };
  }
}

exports.main = main;
exports.getEventPayload = getEventPayload;
exports.validateOrderPayload = validateOrderPayload;
