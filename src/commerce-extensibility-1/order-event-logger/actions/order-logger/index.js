const { Core } = require('@adobe/aio-sdk')

function getEventData (params) {
  if (params.data && typeof params.data === 'object') {
    if (params.data.value && typeof params.data.value === 'object') {
      return params.data.value
    }
    return params.data
  }
  return params
}

async function main (params) {
  const logger = Core.Logger('order-logger', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling the order-logger action')

    const event = getEventData(params)
    const order = event && event.order ? event.order : null

    if (!order) {
      logger.warn('Missing order data in observer.sales_order_save_commit_after event')
      return {
        statusCode: 200,
        body: {
          message: 'no order data to log'
        }
      }
    }

    const incrementId = order.increment_id
    const timestamp = new Date().toISOString()

    if (incrementId) {
      logger.info(`[${timestamp}] order.increment_id=${incrementId}`)
    } else {
      logger.warn(`[${timestamp}] order.increment_id is missing`)
    }

    return {
      statusCode: 200,
      body: {
        message: 'order event logged'
      }
    }
  } catch (error) {
    logger.error(error)
    return {
      statusCode: 500,
      body: {
        error: 'server error'
      }
    }
  }
}

exports.main = main
