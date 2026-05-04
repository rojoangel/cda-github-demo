const crypto = require('crypto')
const { Core } = require('@adobe/aio-sdk')

function getEventBody(params) {
  if (params && params.data && params.data.value) {
    return params.data.value
  }

  if (params && params.data) {
    return params.data
  }

  return params || {}
}

function validateEventBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Invalid event payload'
  }

  if (!body.id) {
    return 'Missing required field: id'
  }

  if (!body.increment_id) {
    return 'Missing required field: increment_id'
  }

  return ''
}

function getSignature(params) {
  return params['x-adobe-signature'] || params['X-Adobe-Signature'] || params.signature || ''
}

function signPayload(secret, body) {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex')
}

function timingSafeEqualHex(a, b) {
  const aBuf = Buffer.from(String(a), 'hex')
  const bBuf = Buffer.from(String(b), 'hex')

  if (aBuf.length !== bBuf.length) {
    return false
  }

  return crypto.timingSafeEqual(aBuf, bBuf)
}

async function main(params) {
  const logger = Core.Logger('order-logger', { level: params.LOG_LEVEL || 'info' })

  try {
    const body = getEventBody(params)
    const validationError = validateEventBody(body)
    if (validationError) {
      logger.warn(validationError)
      return { statusCode: 400, body: { error: validationError } }
    }

    const secret = params.ADOBE_IO_EVENTS_CLIENT_SECRET
    if (!secret) {
      logger.error('Missing ADOBE_IO_EVENTS_CLIENT_SECRET')
      return { statusCode: 500, body: { error: 'Server configuration error' } }
    }

    const signature = getSignature(params)
    if (!signature) {
      logger.warn('Missing event signature')
      return { statusCode: 401, body: { error: 'Unauthorized' } }
    }

    const expectedSignature = signPayload(secret, body)
    if (!timingSafeEqualHex(signature, expectedSignature)) {
      logger.warn('Invalid event signature')
      return { statusCode: 401, body: { error: 'Unauthorized' } }
    }

    logger.info(`Received order event for order ID ${body.id} / increment ${body.increment_id}`)
    return {
      statusCode: 200,
      body: {
        message: 'Order event acknowledged',
        orderId: body.id,
      },
    }
  } catch (error) {
    logger.error(error)
    return { statusCode: 500, body: { error: error.message } }
  }
}

exports.main = main
exports.validateEventBody = validateEventBody
exports.getEventBody = getEventBody
exports.signPayload = signPayload
exports.timingSafeEqualHex = timingSafeEqualHex
