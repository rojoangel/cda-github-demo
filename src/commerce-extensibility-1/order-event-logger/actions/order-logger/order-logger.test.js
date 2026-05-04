const { Core } = require('@adobe/aio-sdk')
const { main } = require('./index')

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}))

describe('order-logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('valid event with order data logs increment id and returns 200', async () => {
    const logger = Core.Logger.mock.results[0] ? Core.Logger.mock.results[0].value : null
    const params = {
      LOG_LEVEL: 'info',
      data: {
        value: {
          order: {
            increment_id: '100000123',
            id: 42,
            created_at: '2024-01-01 12:00:00'
          }
        }
      }
    }

    const response = await main(params)

    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('order event logged')
    expect(Core.Logger).toHaveBeenCalledWith('order-logger', { level: 'info' })
  })

  test('missing order logs warning and returns 200', async () => {
    const params = {
      LOG_LEVEL: 'info',
      data: {
        value: {}
      }
    }

    const response = await main(params)

    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('no order data to log')
  })

  test('malformed event logs error and returns 500', async () => {
    const params = {
      LOG_LEVEL: 'info',
      data: {
        value: {
          order: {
            increment_id: '100000123'
          }
        }
      }
    }

    const originalDate = global.Date
    global.Date = class extends Date {
      constructor () {
        super()
        throw new Error('bad event')
      }
    }

    const response = await main(params)

    global.Date = originalDate

    expect(response.statusCode).toBe(500)
    expect(response.body.error).toBe('server error')
  })
})
