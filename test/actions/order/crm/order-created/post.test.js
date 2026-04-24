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

const mockStatePut = jest.fn();
const mockStateGet = jest.fn();
const mockStateInit = jest.fn().mockResolvedValue({
  get: mockStateGet,
  put: mockStatePut,
});

jest.mock("@adobe/aio-lib-state", () => ({
  init: mockStateInit,
}));

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
jest.mock("@adobe/aio-sdk", () => ({
  Core: { Logger: jest.fn().mockReturnValue(mockLogger) },
}));

const { postProcess, IDEMPOTENCY_TTL_SECONDS } = require("../../../../../actions/order/crm/order-created/post");
const { IDEMPOTENCY_KEY_PREFIX } = require("../../../../../actions/order/crm/order-created/pre");

const PARAMS = { LOG_LEVEL: "error" };
const TRANSFORMED = { increment_id: "000000042" };

afterEach(() => {
  jest.clearAllMocks();
});

describe("Given order CRM post-processor", () => {
  describe("When postProcess is defined", () => {
    test("Then is an instance of Function", () => {
      expect(postProcess).toBeInstanceOf(Function);
    });
  });

  describe("When sendResult indicates success", () => {
    test("Then writes idempotency key to state with correct TTL", async () => {
      mockStatePut.mockResolvedValue(undefined);
      await postProcess(PARAMS, TRANSFORMED, { success: true, statusCode: 200 });
      expect(mockStatePut).toHaveBeenCalledWith(
        `${IDEMPOTENCY_KEY_PREFIX}.000000042`,
        "processed",
        { ttl: IDEMPOTENCY_TTL_SECONDS },
      );
    });

    test("Then logs an info message", async () => {
      mockStatePut.mockResolvedValue(undefined);
      await postProcess(PARAMS, TRANSFORMED, { success: true });
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("000000042"),
      );
    });

    test("Then state write failure is non-fatal (only warn logged)", async () => {
      mockStatePut.mockRejectedValue(new Error("state unavailable"));
      await expect(
        postProcess(PARAMS, TRANSFORMED, { success: true }),
      ).resolves.not.toThrow();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe("When sendResult indicates failure", () => {
    test("Then logs structured error entry with increment_id and http_status", async () => {
      await postProcess(PARAMS, TRANSFORMED, { success: false, statusCode: 503, message: "Service unavailable" });
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      const logArg = mockLogger.error.mock.calls[0][0];
      const parsed = JSON.parse(logArg);
      expect(parsed.increment_id).toBe("000000042");
      expect(parsed.http_status).toBe(503);
      expect(parsed.event).toBe("order-crm-sync-failed");
    });

    test("Then does NOT write idempotency key to state", async () => {
      await postProcess(PARAMS, TRANSFORMED, { success: false, statusCode: 400, message: "Bad Request" });
      expect(mockStatePut).not.toHaveBeenCalled();
    });
  });

  describe("When IDEMPOTENCY_TTL_SECONDS is exported", () => {
    test("Then equals 900", () => {
      expect(IDEMPOTENCY_TTL_SECONDS).toBe(900);
    });
  });
});
