const { Core } = require('@adobe/aio-sdk');

function getEventData(params) {
  return params.data?.value ?? params.data ?? params;
}

async function main(params) {
  const logger = Core.Logger('order-logger', { level: params.LOG_LEVEL || 'info' });

  try {
    const data = getEventData(params);
    const incrementId = data?.increment_id;

    if (incrementId) {
      logger.info(`Received order save event for increment_id=${incrementId}`);
    } else {
      logger.error('Order save event missing increment_id');
    }

    return {
      statusCode: 200,
      body: {
        message: 'event processed',
      },
    };
  } catch (error) {
    logger.error(error);
    return {
      statusCode: 200,
      body: {
        message: 'event processed',
      },
    };
  }
}

exports.main = main;
