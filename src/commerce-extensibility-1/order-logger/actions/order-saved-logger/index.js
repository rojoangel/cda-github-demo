const { Core } = require("@adobe/aio-sdk");

async function main(params) {
  const logger = Core.Logger("order-saved-logger", {
    level: params.LOG_LEVEL || "info",
  });

  try {
    const data = params.data?.value ?? params.data ?? params;
    const incrementId = data.increment_id;

    logger.info(`Order saved: ${incrementId}`);

    return {
      statusCode: 200,
      body: {
        message: "ok",
      },
    };
  } catch (error) {
    logger.error(error);

    return {
      statusCode: 500,
      body: {
        error: "failed to log order save event",
      },
    };
  }
}

exports.main = main;
