jest.mock("@adobe/aio-sdk", () => ({
  Core: {
    Logger: jest.fn(),
  },
}));

const { Core } = require("@adobe/aio-sdk");
const action = require("../src/commerce-extensibility-1/OrderLogger/actions/order-logged/index.js");

const mockLoggerInstance = {
  info: jest.fn(),
  error: jest.fn(),
};

Core.Logger.mockReturnValue(mockLoggerInstance);

beforeEach(() => {
  Core.Logger.mockClear();
  mockLoggerInstance.info.mockReset();
  mockLoggerInstance.error.mockReset();
});

describe("order-logged", () => {
  test("main should be defined", () => {
    expect(action.main).toBeInstanceOf(Function);
  });

  test("valid event payload logs order ID and returns 200", async () => {
    const response = await action.main({
      data: {
        value: {
          order: {
            increment_id: "100000123",
          },
        },
      },
    });

    expect(Core.Logger).toHaveBeenCalledWith("order-logged", { level: "info" });
    expect(mockLoggerInstance.info).toHaveBeenCalledWith("Order saved: 100000123");
    expect(response).toEqual({
      statusCode: 200,
      body: {
        message: "Order logged",
        increment_id: "100000123",
      },
    });
  });

  test("missing order data logs error and returns 200", async () => {
    const response = await action.main({ data: { value: {} } });

    expect(mockLoggerInstance.error).toHaveBeenCalledWith("Missing order increment_id in event payload");
    expect(response).toEqual({
      statusCode: 200,
      body: {
        message: "Missing order increment_id",
      },
    });
  });

  test("exception logs stack trace and returns 200", async () => {
    const error = new Error("boom");
    const originalLogger = Core.Logger;
    Core.Logger.mockImplementation(() => {
      throw error;
    });

    const response = await action.main({});

    expect(originalLogger).toHaveBeenCalledWith("order-logged", { level: "info" });
    expect(response).toEqual({
      statusCode: 200,
      body: {
        message: "Order log handler failed",
      },
    });
    expect(mockLoggerInstance.error).not.toHaveBeenCalled();
    Core.Logger.mockImplementation(() => mockLoggerInstance);
  });
});
