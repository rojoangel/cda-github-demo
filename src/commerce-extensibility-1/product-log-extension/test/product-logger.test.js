jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(),
  },
}))

const { Core } = require('@adobe/aio-sdk')
const action = require('../actions/product-logger/index.js')

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

describe('product-logger', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })

  test('logs product sku for valid event payload', async () => {
    const response = await action.main({ data: { value: { sku: 'SKU-123' } }, LOG_LEVEL: 'debug' })

    expect(Core.Logger).toHaveBeenCalledWith('product-logger', { level: 'debug' })
    expect(mockLogger.info).toHaveBeenCalledWith('Product saved: SKU-123')
    expect(response).toEqual({
      statusCode: 200,
      body: { message: 'Product event logged', sku: 'SKU-123' },
    })
  })

  test('returns 200 when sku is missing', async () => {
    const response = await action.main({ data: { value: { entity_id: '1' } } })

    expect(mockLogger.warn).toHaveBeenCalledWith('Missing sku in product save payload')
    expect(response).toEqual({
      statusCode: 200,
      body: { message: 'SKU missing from product save payload' },
    })
  })

  test('returns 400 for malformed payload', async () => {
    const response = await action.main({ __ow_body: Buffer.from('{bad-json').toString('base64') })

    expect(mockLogger.warn).toHaveBeenCalledWith('Malformed product save payload received')
    expect(response).toEqual({
      statusCode: 400,
      body: { error: 'Malformed product save payload' },
    })
  })
})
