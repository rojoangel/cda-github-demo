jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(),
  },
}))

const { Core } = require('@adobe/aio-sdk')
const action = require('./index.js')

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

Core.Logger.mockReturnValue(mockLogger)

beforeEach(() => {
  Core.Logger.mockClear()
  mockLogger.info.mockReset()
  mockLogger.warn.mockReset()
  mockLogger.error.mockReset()
})

describe('product-save-logger', () => {
  test('should log product_id and return 202 for a valid event payload', async () => {
    const response = await action.main({ data: { value: { product_id: '123' } } })

    expect(Core.Logger).toHaveBeenCalledWith('product-save-logger', { level: 'info' })
    expect(mockLogger.info).toHaveBeenCalledWith('Product saved: 123')
    expect(response).toEqual({ statusCode: 202, body: { message: 'accepted' } })
  })

  test('should warn and return 202 when product_id is missing', async () => {
    const response = await action.main({ data: { value: {} } })

    expect(mockLogger.warn).toHaveBeenCalledWith('Missing product_id in product save event')
    expect(response).toEqual({ statusCode: 202, body: { message: 'accepted' } })
  })

  test('should handle non-nested params payloads', async () => {
    const response = await action.main({ product_id: '456' })

    expect(mockLogger.info).toHaveBeenCalledWith('Product saved: 456')
    expect(response).toEqual({ statusCode: 202, body: { message: 'accepted' } })
  })

  test('should catch and log errors but still return 202', async () => {
    const error = new Error('boom')
    mockLogger.info.mockImplementation(() => {
      throw error
    })

    const response = await action.main({ data: { value: { product_id: '789' } } })

    expect(mockLogger.error).toHaveBeenCalledWith(error)
    expect(response).toEqual({ statusCode: 202, body: { message: 'accepted' } })
  })
})
