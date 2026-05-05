jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn()
  }
}))

const { Core } = require('@adobe/aio-sdk')
const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(logger)

const action = require('../src/commerce-extensibility-1/order-logging/actions/order-modified-handler/index.js')

describe('order-modified-handler', () => {
  beforeEach(() => {
    Core.Logger.mockClear()
    logger.info.mockReset()
    logger.warn.mockReset()
    logger.error.mockReset()
  })

  test('logs the order increment id and returns 200', async () => {
    const response = await action.main({ data: { value: { order: { increment_id: '100000123' } } } })

    expect(Core.Logger).toHaveBeenCalledWith('order-modified-handler', { level: 'info' })
    expect(logger.info).toHaveBeenCalledWith('Order modified event received for order 100000123')
    expect(response).toEqual({
      statusCode: 200,
      body: { message: 'ok' }
    })
  })

  test('returns 400 when increment id is missing', async () => {
    const response = await action.main({ data: { value: { order: {} } } })

    expect(logger.warn).toHaveBeenCalledWith('Missing order.increment_id in event payload')
    expect(response).toEqual({
      statusCode: 400,
      body: { error: 'missing order.increment_id' }
    })
  })

  test('returns 400 when payload is invalid', async () => {
    const response = await action.main(null)

    expect(logger.error).toHaveBeenCalled()
    expect(response).toEqual({
      statusCode: 400,
      body: { error: 'invalid event payload' }
    })
  })
})
