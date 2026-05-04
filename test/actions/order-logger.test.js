const { main } = require('../../actions/order-logger')

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    }))
  }
}))

describe('order-logger', () => {
  let logSpy

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    jest.clearAllMocks()
  })

  it('logs increment_id and returns 200 on valid event', async () => {
    const response = await main({
      LOG_LEVEL: 'info',
      data: {
        value: {
          increment_id: '100000123'
        }
      }
    })

    expect(console.log).toHaveBeenCalledWith('Order saved: 100000123')
    expect(response).toEqual({
      statusCode: 200,
      body: {
        message: 'acknowledged',
        increment_id: '100000123'
      }
    })
  })

  it('returns 400 when increment_id is missing', async () => {
    const response = await main({
      data: {
        value: {}
      }
    })

    expect(response).toEqual({
      statusCode: 400,
      body: {
        error: 'Missing increment_id'
      }
    })
    expect(console.log).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed payload', async () => {
    const response = await main({
      data: null
    })

    expect(response).toEqual({
      statusCode: 400,
      body: {
        error: 'Malformed order event payload'
      }
    })
    expect(console.log).not.toHaveBeenCalled()
  })
})
