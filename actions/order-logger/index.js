const { Core } = require('@adobe/aio-sdk')

async function main (params) {
  const logger = Core.Logger('order-logger', { level: params.LOG_LEVEL || 'info' })

  try {
    const payload = params.data && params.data.value ? params.data.value : params.data || params
    const incrementId = payload && payload.increment_id

    if (!payload || typeof payload !== 'object') {
      logger.error('Malformed order event payload received')
      return {
        statusCode: 400,
        body: {
          error: 'Malformed order event payload'
        }
      }
    }

    if (!incrementId) {
      logger.error('Missing increment_id in order event payload')
      return {
        statusCode: 400,
        body: {
          error: 'Missing increment_id'
        }
      }
    }

    logger.info(`Order saved: ${incrementId}`)
    console.log(`Order saved: ${incrementId}`)

    return {
      statusCode: 200,
      body: {
        message: 'acknowledged',
        increment_id: incrementId
      }
    }
  } catch (error) {
    logger.error(error)
    return {
      statusCode: 500,
      body: {
        error: 'Internal server error'
      }
    }
  }
}

exports.main = main
