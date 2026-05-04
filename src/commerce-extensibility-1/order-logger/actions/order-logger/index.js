const { Core } = require('@adobe/aio-sdk')

function getEventData(params) {
  return params.data && params.data.value ? params.data.value : params.data || params
}

async function main(params) {
  const logger = Core.Logger('order-logger', { level: params.LOG_LEVEL || 'info' })

  try {
    const eventData = getEventData(params)
    const incrementId = eventData && eventData.increment_id

    if (!incrementId) {
      logger.warn('Received order save event without increment_id')
      return {
        statusCode: 200,
        body: { message: 'acknowledged' }
      }
    }

    logger.info(`Received order save event for increment_id: ${incrementId}`)

    return {
      statusCode: 200,
      body: { message: 'acknowledged', increment_id: incrementId }
    }
  } catch (error) {
    logger.error(error)

    return {
      statusCode: 200,
      body: { message: 'acknowledged' }
    }
  }
}

exports.main = main
