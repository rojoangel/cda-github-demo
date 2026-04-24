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

const mockStateGet = jest.fn();
const mockStatePut = jest.fn();
const mockStateInit = jest.fn().mockResolvedValue({
  get: mockStateGet,
  put: mockStatePut,
});

jest.mock("@adobe/aio-lib-state", () => ({
  init: mockStateInit,
}));

const { preProcess, IDEMPOTENCY_KEY_PREFIX } = require("../../../../../actions/order/crm/order-created/pre");

afterEach(() => {
  jest.clearAllMocks();
});

describe("Given order CRM pre-processor", () => {
  describe("When preProcess is defined", () => {
    test("Then is an instance of Function", () => {
      expect(preProcess).toBeInstanceOf(Function);
    });
  });

  describe("When order has NOT been processed before", () => {
    test("Then returns { duplicate: false } and reads state", async () => {
      mockStateGet.mockResolvedValue(null);
      const params = {
        data: { value: { id: 42, increment_id: "000000042" } },
      };
      const result = await preProcess(params);
      expect(result).toEqual({ duplicate: false, increment_id: "000000042" });
      expect(mockStateInit).toHaveBeenCalledTimes(1);
      expect(mockStateGet).toHaveBeenCalledWith(`${IDEMPOTENCY_KEY_PREFIX}.000000042`);
    });
  });

  describe("When order has already been processed", () => {
    test("Then returns { duplicate: true }", async () => {
      mockStateGet.mockResolvedValue({ value: "processed" });
      const params = {
        data: { value: { id: 42, increment_id: "000000042" } },
      };
      const result = await preProcess(params);
      expect(result).toEqual({ duplicate: true, increment_id: "000000042" });
    });
  });

  describe("When data payload is missing", () => {
    test("Then returns null", async () => {
      const result = await preProcess({});
      expect(result).toBeNull();
    });
  });

  describe("When increment_id is missing", () => {
    test("Then returns null", async () => {
      const result = await preProcess({ data: { value: { id: 1 } } });
      expect(result).toBeNull();
    });
  });

  describe("When data is not wrapped in value", () => {
    test("Then still reads increment_id from top-level data", async () => {
      mockStateGet.mockResolvedValue(null);
      const params = { data: { id: 10, increment_id: "000000010" } };
      const result = await preProcess(params);
      expect(result).toEqual({ duplicate: false, increment_id: "000000010" });
    });
  });
});
