jest.mock("../../../../actions/order/logger/validator", () => ({
  validateData: jest.fn(),
}));

const action = require("../../../../actions/order/logger");
const { validateData } = require("../../../../actions/order/logger/validator");

describe("order logger action", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("logs order details and returns success", async () => {
    validateData.mockReturnValue({ success: true });

    const response = await action.main({
      data: {
        order_id: 42,
        entity_id: 42,
        created_at: "2026-05-06T12:00:00.000Z",
      },
      headers: {
        "X-Adobe-Signature": "valid",
      },
      WEBHOOK_SECRET: "secret",
    });

    expect(validateData).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      "Order event received: order_id=42, created_at=2026-05-06T12:00:00.000Z",
    );
    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        order_id: 42,
        created_at: "2026-05-06T12:00:00.000Z",
      },
    });
  });

  test("returns validation error response", async () => {
    validateData.mockReturnValue({
      success: false,
      statusCode: 401,
      message: "Invalid signature",
    });

    const response = await action.main({
      data: {},
      headers: {},
      WEBHOOK_SECRET: "secret",
    });

    expect(console.log).not.toHaveBeenCalled();
    expect(response).toEqual({
      statusCode: 401,
      body: {
        success: false,
        error: "Invalid signature",
      },
    });
  });
});
