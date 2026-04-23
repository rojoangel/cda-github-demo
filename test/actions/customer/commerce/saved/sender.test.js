const { sendData, MAX_RETRIES } = require("../../../../../actions/customer/commerce/saved/sender");

beforeAll(() => {
  process.env.__AIO_DEV = "false";
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

const transformedData = {
  id: 123,
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  timestamp: "2024-01-01T00:00:00.000Z",
};

const params = {
  ERP_API_URL: "https://erp.example.com/api/v1/customers",
  LOG_LEVEL: "debug",
  ENABLE_TELEMETRY: true,
};

const preProcessed = { skipped: false, stateKey: "customer-123" };

describe("Given customer commerce saved sender", () => {
  describe("When preProcessed.skipped is true", () => {
    test("Then returns success without calling fetch", async () => {
      const fetchMock = jest.fn();
      global.fetch = fetchMock;

      const result = await sendData(params, transformedData, { skipped: true, stateKey: "customer-123" });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("When ERP_API_URL is missing", () => {
    test("Then returns failure with statusCode 500", async () => {
      const result = await sendData({ LOG_LEVEL: "debug", ENABLE_TELEMETRY: true }, transformedData, preProcessed);
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.message).toMatch(/ERP_API_URL/);
    });
  });

  describe("When ERP responds with 200", () => {
    test("Then returns success on first attempt", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await sendData(params, transformedData, preProcessed);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://erp.example.com/api/v1/customers",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transformedData),
        }),
      );
    });
  });

  describe("When ERP responds 500 then 200", () => {
    test("Then retries and succeeds on second attempt", async () => {
      jest.useFakeTimers();
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, status: 200 });
      global.fetch = fetchMock;

      const promise = sendData(params, transformedData, preProcessed);
      // Advance timers to skip sleep delays
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe(`When ERP always responds with 503 (${MAX_RETRIES} attempts)", () => {
    test("Then exhausts retries and returns failure", async () => {
      jest.useFakeTimers();
      const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 503 });
      global.fetch = fetchMock;

      const promise = sendData(params, transformedData, preProcessed);
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.success).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(MAX_RETRIES);
      expect(result.message).toMatch(/failed after/);
    });
  });

  describe("When fetch throws a network error", () => {
    test("Then retries and ultimately fails", async () => {
      jest.useFakeTimers();
      const fetchMock = jest.fn().mockRejectedValue(new Error("Network error"));
      global.fetch = fetchMock;

      const promise = sendData(params, transformedData, preProcessed);
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.success).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(MAX_RETRIES);
    });
  });
});
