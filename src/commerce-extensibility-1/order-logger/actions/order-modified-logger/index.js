const { Core } = require('@adobe/aio-sdk')

async function main(params) {
  const logger = Core.Logger('order-modified-logger', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Processing order modified event')

    const data = params.data?.value || params.data || params
    const incrementId = data.increment_id
    const updatedAt = data.updated_at

    if (!incrementId) {
      logger.warn('Missing increment_id in order modified event')
      return {
        statusCode: 200,
        body: {
          message: 'order modified event received without increment_id',
        },
      }
    }

    logger.info(`Order modified: ${incrementId} at ${updatedAt || 'unknown time'}`)

    return {
      statusCode: 200,
      body: {
        message: 'order modified event processed',
      },
    }
  } catch (error) {
    logger.error(error)
    return {
      statusCode: 500,
      body: {
        error: 'failed to process order modified event',
      },
    }
  }
}

exports.main = main
