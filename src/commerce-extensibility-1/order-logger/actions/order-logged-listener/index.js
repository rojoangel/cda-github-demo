const { Core } = require('@adobe/aio-sdk')

async function main (params) {
  const logger = Core.Logger('order-logged-listener', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Starting order-logged-listener')

    const event = params.data?.value || params.data || params
    const incrementId = event.increment_id

    if (!incrementId) {
      logger.warn('Missing increment_id in order event payload')
      return {
        statusCode: 200,
        body: { message: 'Order event received' }
      }
    }

    console.log(`Order saved: ${incrementId}`)
    logger.info(`Logged order increment_id ${incrementId}`)

    return {
      statusCode: 200,
      body: { message: 'Order event received' }
    }
  } catch (error) {
    logger.error(error)
    console.log('Failed to process order event')

    return {
      statusCode: 200,
      body: { message: 'Order event received' }
    }
  }
}

exports.main = main
