const { Core } = require("@adobe/aio-sdk");

async function main(params) {
  const logger = Core.Logger("order/save-logged", { level: params.LOG_LEVEL || "info" });

  try {
    const data = params.data && params.data.value ? params.data.value : params.data || params;
    const incrementId = data && data.order ? data.order.increment_id : undefined;

    if (!incrementId) {
      logger.warn("Missing order increment_id in Commerce event payload");
      return {
        statusCode: 400,
        body: { error: "Missing order increment_id" },
      };
    }

    logger.info(`Received order increment_id: ${incrementId}`);
    console.log(`Order increment_id: ${incrementId}`);

    return {
      statusCode: 200,
      body: { orderId: incrementId, received: true },
    };
  } catch (error) {
    logger.error(error);
    return {
      statusCode: 500,
      body: { error: error.message || "Unexpected error" },
    };
  }
}

exports.main = main;
