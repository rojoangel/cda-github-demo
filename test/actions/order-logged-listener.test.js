jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn()
  }
}))

const { Core } = require('@adobe/aio-sdk')
const mockLoggerInstance = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}
Core.Logger.mockReturnValue(mockLoggerInstance)

const action = require('../../src/commerce-extensibility-1/order-logger/actions/order-logged-listener/index.js')

describe('order-logged-listener', () => {
  beforeEach(() => {
    Core.Logger.mockClear()
    mockLoggerInstance.info.mockReset()
    mockLoggerInstance.warn.mockReset()
    mockLoggerInstance.error.mockReset()
    console.log = jest.fn()
  })

  test('logs the increment_id from the event payload', async () => {
    const response = await action.main({
      LOG_LEVEL: 'info',
      data: {
        value: {
          increment_id: '100000123'
        }
      }
    })

    expect(Core.Logger).toHaveBeenCalledWith('order-logged-listener', { level: 'info' })
    expect(console.log).toHaveBeenCalledWith('Order saved: 100000123')
    expect(response).toEqual({
      statusCode: 200,
      body: { message: 'Order event received' }
    })
  })
})
