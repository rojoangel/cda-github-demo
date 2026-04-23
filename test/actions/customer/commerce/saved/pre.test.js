jest.mock("@adobe/aio-lib-state");
const stateLib = require("@adobe/aio-lib-state");
const { preProcess } = require("../../../../../actions/customer/commerce/saved/pre");

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

describe("Given customer commerce saved pre-processor", () => {
  describe("When no prior state record exists", () => {
    test("Then skipped is false and stateKey is set", async () => {
      const mockState = { get: jest.fn().mockResolvedValue(null), put: jest.fn() };
      stateLib.init.mockResolvedValue(mockState);

      const result = await preProcess(params, transformedData);

      expect(result.skipped).toBe(false);
      expect(result.stateKey).toBe("customer-123");
      expect(mockState.get).toHaveBeenCalledWith("customer-123");
    });
  });

  describe("When a completed state record exists", () => {
    test("Then skipped is true", async () => {
      const mockState = {
        get: jest.fn().mockResolvedValue({ value: { status: "completed" } }),
        put: jest.fn(),
      };
      stateLib.init.mockResolvedValue(mockState);

      const result = await preProcess(params, transformedData);

      expect(result.skipped).toBe(true);
      expect(result.alreadyProcessed).toBe(true);
    });
  });

  describe("When a failed state record exists", () => {
    test("Then skipped is false (allow re-processing)", async () => {
      const mockState = {
        get: jest.fn().mockResolvedValue({ value: { status: "failed" } }),
        put: jest.fn(),
      };
      stateLib.init.mockResolvedValue(mockState);

      const result = await preProcess(params, transformedData);

      expect(result.skipped).toBe(false);
    });
  });

  describe("When State.init throws an error", () => {
    test("Then skipped is false (non-fatal error path)", async () => {
      stateLib.init.mockRejectedValue(new Error("State service unavailable"));

      const result = await preProcess(params, transformedData);

      expect(result.skipped).toBe(false);
      expect(result.stateKey).toBe("customer-123");
    });
  });
});
