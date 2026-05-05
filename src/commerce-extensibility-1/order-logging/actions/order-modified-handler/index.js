const { Core } = require('@adobe/aio-sdk')

function getOrderIncrementId(params) {
  const payload = params.data && params.data.value ? params.data.value : params
  return payload && payload.order && payload.order.increment_id ? payload.order.increment_id : undefined
}

async function main(params) {
  const logger = Core.Logger('order-modified-handler', { level: params.LOG_LEVEL || 'info' })

  try {
    const orderIncrementId = getOrderIncrementId(params)

    if (!orderIncrementId) {
      logger.warn('Missing order.increment_id in event payload')
      return {
        statusCode: 400,
        body: {
          error: 'missing order.increment_id'
        }
      }
    }

    logger.info(`Order modified event received for order ${orderIncrementId}`)

    return {
      statusCode: 200,
      body: {
        message: 'ok'
      }
    }
  } catch (error) {
    logger.error(error)
    return {
      statusCode: 400,
      body: {
        error: 'invalid event payload'
      }
    }
  }
}

exports.main = main
