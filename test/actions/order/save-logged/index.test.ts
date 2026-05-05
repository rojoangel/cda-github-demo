jest.mock("@adobe/aio-sdk", () => ({
  Core: {
    Logger: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

const { Core } = require("@adobe/aio-sdk");
const { main } = require("../../../../src/commerce-extensibility-1/order/actions/save-logged/index.ts");

describe("order/save-logged", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs increment_id and returns 200 for valid event", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const response = await main({
      LOG_LEVEL: "info",
      data: { value: { order: { increment_id: "00000123" } } },
    });

    expect(Core.Logger).toHaveBeenCalledWith("order/save-logged", { level: "info" });
    expect(logSpy).toHaveBeenCalledWith("Order increment_id: 00000123");
    expect(response).toEqual({
      statusCode: 200,
      body: { orderId: "00000123", received: true },
    });

    logSpy.mockRestore();
  });

  it("returns 400 when increment_id is missing", async () => {
    const response = await main({ LOG_LEVEL: "info", data: { value: { order: {} } } });

    expect(response).toEqual({
      statusCode: 400,
      body: { error: "Missing order increment_id" },
    });
  });

  it("returns 500 when handler throws", async () => {
    const originalLog = console.log;
    console.log = () => {
      throw new Error("boom");
    };

    const response = await main({
      LOG_LEVEL: "info",
      data: { value: { order: { increment_id: "00000123" } } },
    });

    expect(response).toEqual({
      statusCode: 500,
      body: { error: "boom" },
    });

    console.log = originalLog;
  });
});
