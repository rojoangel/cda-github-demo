jest.mock("@adobe/aio-sdk", () => ({
  Core: {
    Logger: jest.fn(),
  },
}));

const { Core } = require("@adobe/aio-sdk");
const loggerInstance = { info: jest.fn(), error: jest.fn() };
Core.Logger.mockReturnValue(loggerInstance);

const action = require("../../../src/commerce-extensibility-1/order-event-logger/actions/order-event-handler/index.js");

describe("order-event-handler", () => {
  beforeEach(() => {
    Core.Logger.mockClear();
    loggerInstance.info.mockReset();
    loggerInstance.error.mockReset();
  });

  test("should export main", () => {
    expect(action.main).toBeInstanceOf(Function);
  });

  test("should acknowledge a valid order payload and log the order id", async () => {
    const response = await action.main({
      LOG_LEVEL: "debug",
      data: {
        value: {
          id: 123,
          increment_id: "100000123",
        },
      },
    });

    expect(Core.Logger).toHaveBeenCalledWith("order-event-handler", { level: "debug" });
    expect(loggerInstance.info).toHaveBeenCalledWith("Order received: id=123, increment_id=100000123");
    expect(response).toEqual({
      statusCode: 200,
      body: {
        acknowledged: true,
        orderId: 123,
        incrementId: "100000123",
      },
    });
  });

  test("should return 400 when id is missing", async () => {
    const response = await action.main({
      data: {
        value: {
          increment_id: "100000123",
        },
      },
    });

    expect(response).toEqual({
      statusCode: 400,
      body: {
        error: "missing required field: id",
      },
    });
    expect(loggerInstance.error).toHaveBeenCalledWith("missing required field: id");
  });

  test("should return 400 when increment_id is missing", async () => {
    const response = await action.main({
      data: {
        value: {
          id: 123,
        },
      },
    });

    expect(response).toEqual({
      statusCode: 400,
      body: {
        error: "missing required field: increment_id",
      },
    });
  });

  test("should return 400 for malformed event payloads", async () => {
    const response = await action.main({
      data: null,
    });

    expect(response).toEqual({
      statusCode: 400,
      body: {
        error: "invalid event payload",
      },
    });
  });

  test("should return 500 on unexpected errors", async () => {
    const originalValidate = action.validateOrderPayload;
    action.validateOrderPayload = () => {
      throw new Error("boom");
    };

    const response = await action.main({ data: { value: { id: 1, increment_id: "2" } } });

    expect(response).toEqual({
      statusCode: 500,
      body: {
        error: "unexpected error processing order event",
      },
    });
    expect(loggerInstance.error).toHaveBeenCalled();
    action.validateOrderPayload = originalValidate;
  });
});
