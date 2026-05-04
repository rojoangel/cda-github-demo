const crypto = require('crypto')
const { main, validateEventBody, signPayload } = require('../index')

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  },
}))

describe('validateEventBody', () => {
  test('accepts valid event bodies', () => {
    expect(validateEventBody({ id: 1, increment_id: '10000001' })).toBe('')
  })

  test('rejects invalid payloads', () => {
    expect(validateEventBody(null)).toBe('Invalid event payload')
    expect(validateEventBody([])).toBe('Invalid event payload')
    expect(validateEventBody({})).toBe('Missing required field: id')
    expect(validateEventBody({ id: 1 })).toBe('Missing required field: increment_id')
  })
})

describe('signPayload', () => {
  test('creates sha256 hmac signatures', () => {
    const body = { id: 1, increment_id: '10000001' }
    const secret = 'secret'
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex')
    expect(signPayload(secret, body)).toBe(expected)
  })
})

describe('main', () => {
  const secret = 'super-secret'
  const body = { id: 1, increment_id: '10000001' }
  const signature = signPayload(secret, body)

  test('returns 200 and logs valid event payloads', async () => {
    const response = await main({
      LOG_LEVEL: 'info',
      ADOBE_IO_EVENTS_CLIENT_SECRET: secret,
      'x-adobe-signature': signature,
      data: { value: body },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      message: 'Order event acknowledged',
      orderId: 1,
    })
  })

  test('returns 401 for invalid signatures', async () => {
    const response = await main({
      LOG_LEVEL: 'info',
      ADOBE_IO_EVENTS_CLIENT_SECRET: secret,
      'x-adobe-signature': 'deadbeef',
      data: { value: body },
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Unauthorized' })
  })

  test('returns 400 for missing fields', async () => {
    const response = await main({
      LOG_LEVEL: 'info',
      ADOBE_IO_EVENTS_CLIENT_SECRET: secret,
      'x-adobe-signature': signPayload(secret, { id: 1 }),
      data: { value: { id: 1 } },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({ error: 'Missing required field: increment_id' })
  })

  test('returns 500 when secret is missing', async () => {
    const response = await main({
      LOG_LEVEL: 'info',
      'x-adobe-signature': signature,
      data: { value: body },
    })

    expect(response.statusCode).toBe(500)
    expect(response.body).toEqual({ error: 'Server configuration error' })
  })
})
