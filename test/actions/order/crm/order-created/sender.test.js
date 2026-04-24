/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

// Stub aio-sdk Logger before requiring the module
jest.mock("@adobe/aio-sdk", () => ({
  Core: {
    Logger: jest.fn().mockReturnValue({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

const { sendData, MAX_RETRIES, BASE_DELAY_MS } = require("../../../../../actions/order/crm/order-created/sender");

// Replace global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Speed up retries in tests
jest.useFakeTimers();

const BASE_PARAMS = {
  CRM_ENDPOINT_URL: "https://crm.example.com/api/orders",
  CRM_API_KEY: "test-api-key",
  LOG_LEVEL: "error",
};

const TRANSFORMED_DATA = {
  id: 42,
  increment_id: "000000042",
  created_at: "2024-08-05 14:34:19",
  updated_at: "2024-08-05 14:34:19",
  items: [],
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("Given order CRM sender", () => {
  describe("When sendData is defined", () => {
    test("Then is an instance of Function", () => {
      expect(sendData).toBeInstanceOf(Function);
    });
  });

  describe("When CRM_ENDPOINT_URL is not configured", () => {
    test("Then returns failure without calling fetch", async () => {
      const result = await sendData({ LOG_LEVEL: "error" }, TRANSFORMED_DATA);
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("When CRM responds with 200", () => {
    test("Then returns success on first attempt", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => "" });
      const promise = sendData(BASE_PARAMS, TRANSFORMED_DATA);
      jest.runAllTimers();
      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test("Then Authorization header contains Bearer token", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => "" });
      const promise = sendData(BASE_PARAMS, TRANSFORMED_DATA);
      jest.runAllTimers();
      await promise;
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers["Authorization"]).toBe("Bearer test-api-key");
    });
  });

  describe("When CRM responds with 400 (non-retryable)", () => {
    test("Then returns failure immediately without retrying", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });
      const promise = sendData(BASE_PARAMS, TRANSFORMED_DATA);
      jest.runAllTimers();
      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      // Should NOT retry on 4xx
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("When CRM responds with 503 three times (retryable)", () => {
    test(`Then retries ${MAX_RETRIES} times and returns failure`, async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => "Service Unavailable",
      });
      const promise = sendData(BASE_PARAMS, TRANSFORMED_DATA);
      jest.runAllTimers();
      const result = await promise;
      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(MAX_RETRIES);
    });
  });

  describe("When network throws on first attempt then succeeds", () => {
    test("Then retries and returns success", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("ECONNRESET"))
        .mockResolvedValueOnce({ ok: true, status: 201, text: async () => "" });
      const promise = sendData(BASE_PARAMS, TRANSFORMED_DATA);
      jest.runAllTimers();
      const result = await promise;
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("When exported constants", () => {
    test("Then MAX_RETRIES is 3", () => {
      expect(MAX_RETRIES).toBe(3);
    });
    test("Then BASE_DELAY_MS is 1000", () => {
      expect(BASE_DELAY_MS).toBe(1000);
    });
  });
});
