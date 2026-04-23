jest.mock("@adobe/aio-lib-state");
const stateLib = require("@adobe/aio-lib-state");
const { postProcess } = require("../../../../../actions/customer/commerce/saved/post");

beforeAll(() => {
  process.env.__AIO_DEV = "false";
});

afterEach(() => {
  jest.clearAllMocks();
});

const params = { LOG_LEVEL: "debug", ENABLE_TELEMETRY: true };
const transformedData = {
  id: 123,
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  timestamp: "2024-01-01T00:00:00.000Z",
};
const preProcessed = { skipped: false, stateKey: "customer-123" };

describe("Given customer commerce saved post-processor", () => {
  describe("When send result is success", () => {
    test("Then stores status=completed in State", async () => {
      const mockPut = jest.fn().mockResolvedValue(true);
      const mockState = { get: jest.fn(), put: mockPut };
      stateLib.init.mockResolvedValue(mockState);

      await postProcess(params, transformedData, preProcessed, { success: true, statusCode: 200 });

      expect(mockPut).toHaveBeenCalledWith(
        "customer-123",
        expect.objectContaining({ status: "completed", customerId: 123 }),
        expect.objectContaining({ ttl: expect.any(Number) }),
      );
    });
  });

  describe("When send result is failure", () => {
    test("Then stores status=failed with error in State", async () => {
      const mockPut = jest.fn().mockResolvedValue(true);
      const mockState = { get: jest.fn(), put: mockPut };
      stateLib.init.mockResolvedValue(mockState);

      await postProcess(
        params,
        transformedData,
        preProcessed,
        { success: false, statusCode: 502, message: "ERP unavailable" },
      );

      expect(mockPut).toHaveBeenCalledWith(
        "customer-123",
        expect.objectContaining({ status: "failed", error: "ERP unavailable" }),
        expect.anything(),
      );
    });
  });

  describe("When preProcessed.skipped is true", () => {
    test("Then State.init is never called", async () => {
      await postProcess(
        params,
        transformedData,
        { skipped: true, stateKey: "customer-123" },
        { success: true, statusCode: 200 },
      );

      expect(stateLib.init).not.toHaveBeenCalled();
    });
  });

  describe("When State.init throws", () => {
    test("Then resolves without throwing (non-fatal path)", async () => {
      stateLib.init.mockRejectedValue(new Error("State unavailable"));

      await expect(
        postProcess(params, transformedData, preProcessed, { success: true, statusCode: 200 }),
      ).resolves.not.toThrow();
    });
  });
});
