const { Core } = require('@adobe/aio-sdk')

function parseBody(params) {
  if (params.__ow_body) {
    try {
      return JSON.parse(Buffer.from(params.__ow_body, 'base64').toString('utf-8'))
    } catch (error) {
      return null
    }
  }

  if (params.data && typeof params.data === 'object') {
    return params.data.value || params.data
  }

  const body = {}
  for (const [key, value] of Object.entries(params)) {
    if (!key.startsWith('__') && key !== 'LOG_LEVEL') {
      body[key] = value
    }
  }

  return body
}

async function main(params) {
  const logger = Core.Logger('product-logger', { level: params.LOG_LEVEL || 'info' })

  try {
    const payload = parseBody(params)

    if (!payload || typeof payload !== 'object') {
      logger.warn('Malformed product save payload received')
      return {
        statusCode: 400,
        body: { error: 'Malformed product save payload' },
      }
    }

    const sku = payload.sku
    if (!sku || typeof sku !== 'string' || !sku.trim()) {
      logger.warn('Missing sku in product save payload')
      return {
        statusCode: 200,
        body: { message: 'SKU missing from product save payload' },
      }
    }

    logger.info(`Product saved: ${sku}`)
    return {
      statusCode: 200,
      body: { message: 'Product event logged', sku },
    }
  } catch (error) {
    logger.error(error)
    return {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    }
  }
}

exports.main = main
exports.parseBody = parseBody
