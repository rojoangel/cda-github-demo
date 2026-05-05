const { Core } = require("@adobe/aio-sdk");

async function main(params) {
  const logger = Core.Logger("order-logged", { level: params.LOG_LEVEL || "info" });

  try {
    logger.info("Processing order saved event");

    const order = params.data?.value?.order ?? params.data?.value ?? params.order ?? params;
    const incrementId = order?.increment_id;

    if (!incrementId) {
      logger.error("Missing order increment_id in event payload");
      return {
        statusCode: 200,
        body: {
          message: "Missing order increment_id",
        },
      };
    }

    logger.info(`Order saved: ${incrementId}`);
    return {
      statusCode: 200,
      body: {
        message: "Order logged",
        increment_id: incrementId,
      },
    };
  } catch (error) {
    logger.error(error);
    logger.error(error.stack || error.message || String(error));
    return {
      statusCode: 200,
      body: {
        message: "Order log handler failed",
      },
    };
  }
}

exports.main = main;
