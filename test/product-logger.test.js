jest.mock("@adobe/aio-sdk", () => ({
  Core: {
    Logger: jest.fn(),
  },
}));

const { Core } = require("@adobe/aio-sdk");
const action = require("../src/commerce-extensibility-1/product-logger/actions/product-logger/index.js");

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

Core.Logger.mockReturnValue(logger);

describe("product-logger", () => {
  beforeEach(() => {
    Core.Logger.mockClear();
    logger.info.mockReset();
    logger.warn.mockReset();
    logger.error.mockReset();
  });

  test("logs the product ID and returns success", async () => {
    const response = await action.main({
      LOG_LEVEL: "debug",
      data: { value: { product_id: "123" } },
    });

    expect(Core.Logger).toHaveBeenCalledWith("product-logger", { level: "debug" });
    expect(logger.info).toHaveBeenCalledWith("Product saved event received for product ID: 123");
    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        productId: "123",
      },
    });
  });

  test("returns 400 for missing payload", async () => {
    const response = await action.main({});

    expect(logger.error).toHaveBeenCalledWith("Missing or malformed product event payload");
    expect(response).toEqual({
      statusCode: 400,
      body: {
        success: false,
        error: "Missing or malformed product event payload",
      },
    });
  });

  test("warns when product ID is missing but still succeeds", async () => {
    const response = await action.main({
      data: { value: { sku: "sample-sku" } },
    });

    expect(logger.warn).toHaveBeenCalledWith("Product event received without a product ID");
    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        productId: null,
      },
    });
  });

  test("gracefully acknowledges when logging throws", async () => {
    logger.info.mockImplementation(() => {
      throw new Error("boom");
    });

    const response = await action.main({
      data: { value: { product_id: "456" } },
    });

    expect(logger.error).toHaveBeenCalledWith(expect.any(Error));
    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        productId: "456",
      },
    });
  });
});
