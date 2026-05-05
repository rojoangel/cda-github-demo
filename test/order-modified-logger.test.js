jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  },
}))

const { Core } = require('@adobe/aio-sdk')
const { main } = require('../src/commerce-extensibility-1/order-logger/actions/order-modified-logger/index')

describe('order-modified-logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the order id and returns 200 for a valid event', async () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    Core.Logger.mockReturnValue(logger)

    const result = await main({
      LOG_LEVEL: 'debug',
      data: {
        value: {
          increment_id: '100000123',
          updated_at: '2026-01-01 12:00:00',
        },
      },
    })

    expect(logger.info).toHaveBeenCalledWith('Processing order modified event')
    expect(logger.info).toHaveBeenCalledWith('Order modified: 100000123 at 2026-01-01 12:00:00')
    expect(result).toEqual({
      statusCode: 200,
      body: {
        message: 'order modified event processed',
      },
    })
  })

  it('logs a warning and returns 200 when increment_id is missing', async () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    Core.Logger.mockReturnValue(logger)

    const result = await main({
      data: {
        value: {
          updated_at: '2026-01-01 12:00:00',
        },
      },
    })

    expect(logger.warn).toHaveBeenCalledWith('Missing increment_id in order modified event')
    expect(result).toEqual({
      statusCode: 200,
      body: {
        message: 'order modified event received without increment_id',
      },
    })
  })

  it('returns 500 when the action throws', async () => {
    const logger = { info: jest.fn(() => { throw new Error('boom') }), warn: jest.fn(), error: jest.fn() }
    Core.Logger.mockReturnValue(logger)

    const result = await main({})

    expect(logger.error).toHaveBeenCalled()
    expect(result).toEqual({
      statusCode: 500,
      body: {
        error: 'failed to process order modified event',
      },
    })
  })
})
