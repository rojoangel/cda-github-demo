jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

const { Core } = require('@adobe/aio-sdk');
const { main } = require('./index');

describe('order-logger', () => {
  let logger;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    Core.Logger.mockReturnValue(logger);
    jest.clearAllMocks();
  });

  it('logs increment_id and returns 200 for a valid order event', async () => {
    const response = await main({
      LOG_LEVEL: 'info',
      data: {
        value: {
          increment_id: '100000123',
          id: 42,
          created_at: '2026-01-01 00:00:00',
        },
      },
    });

    expect(logger.info).toHaveBeenCalledWith('Received order save event for increment_id=100000123');
    expect(response).toEqual({
      statusCode: 200,
      body: { message: 'event processed' },
    });
  });

  it('logs an error safely and returns 200 when increment_id is missing', async () => {
    const response = await main({
      LOG_LEVEL: 'info',
      data: {
        value: {
          id: 42,
          created_at: '2026-01-01 00:00:00',
        },
      },
    });

    expect(logger.error).toHaveBeenCalledWith('Order save event missing increment_id');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'event processed' });
  });

  it('handles malformed payloads gracefully and returns 200', async () => {
    const response = await main({
      LOG_LEVEL: 'info',
      data: null,
    });

    expect(logger.error).toHaveBeenCalledWith('Order save event missing increment_id');
    expect(response).toEqual({
      statusCode: 200,
      body: { message: 'event processed' },
    });
  });
});
