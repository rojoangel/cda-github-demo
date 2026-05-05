const { Core } = require('@adobe/aio-sdk')

async function main(params) {
  const logger = Core.Logger('product-save-logger', { level: params.LOG_LEVEL || 'info' })

  try {
    const event = params.data?.value ?? params
    const productId = event.product_id

    if (!productId) {
      logger.warn('Missing product_id in product save event')
      return { statusCode: 202, body: { message: 'accepted' } }
    }

    logger.info(`Product saved: ${productId}`)
    return { statusCode: 202, body: { message: 'accepted' } }
  } catch (error) {
    logger.error(error)
    return { statusCode: 202, body: { message: 'accepted' } }
  }
}

exports.main = main
