const { Core } = require("@adobe/aio-sdk");

function extractProductId(params) {
  const value = params.data?.value ?? params.data ?? params;
  return value?.product_id ?? value?.productId ?? value?.entity_id ?? value?.id ?? null;
}

async function main(params) {
  const logger = Core.Logger("product-logger", { level: params.LOG_LEVEL || "info" });

  try {
    const data = params.data?.value ?? params.data ?? params;

    if (!data || typeof data !== "object") {
      logger.error("Missing or malformed product event payload");
      return {
        statusCode: 400,
        body: { success: false, error: "Missing or malformed product event payload" },
      };
    }

    const productId = extractProductId(params);

    if (!productId) {
      logger.warn("Product event received without a product ID");
    }

    logger.info(`Product saved event received for product ID: ${productId ?? "unknown"}`);

    return {
      statusCode: 200,
      body: {
        success: true,
        productId: productId ?? null,
      },
    };
  } catch (error) {
    logger.error(error);
    logger.warn("Failed to log product event, returning graceful acknowledgment");
    return {
      statusCode: 200,
      body: {
        success: true,
        productId: extractProductId(params),
      },
    };
  }
}

exports.main = main;
