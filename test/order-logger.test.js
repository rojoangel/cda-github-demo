jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn()
  }
}))

const { Core } = require('@adobe/aio-sdk')
const mockLoggerInstance = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)

const action = require('../src/commerce-extensibility-1/order-logger/actions/order-logger/index.js')

beforeEach(() => {
  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
  mockLoggerInstance.warn.mockReset()
  mockLoggerInstance.error.mockReset()
})

describe('order-logger', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })

  test('valid payload logs increment_id and returns 200', async () => {
    const response = await action.main({
      LOG_LEVEL: 'debug',
      data: {
        value: {
          increment_id: '100000123'
        }
      }
    })

    expect(Core.Logger).toHaveBeenCalledWith('order-logger', { level: 'debug' })
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Received order save event for increment_id: 100000123')
    expect(response).toEqual({
      statusCode: 200,
      body: { message: 'acknowledged', increment_id: '100000123' }
    })
  })

  test('missing increment_id logs warning and returns 200', async () => {
    const response = await action.main({ data: { value: {} } })

    expect(mockLoggerInstance.warn).toHaveBeenCalledWith('Received order save event without increment_id')
    expect(response).toEqual({
      statusCode: 200,
      body: { message: 'acknowledged' }
    })
  })

  test('malformed event is caught and still returns 200', async () => {
    const response = await action.main(null)

    expect(mockLoggerInstance.error).toHaveBeenCalled()
    expect(response).toEqual({
      statusCode: 200,
      body: { message: 'acknowledged' }
    })
  })
})
