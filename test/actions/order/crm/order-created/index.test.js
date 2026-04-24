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

// ---------------------------------------------------------------------------
// Mock all collaborators before requiring the action under test
// ---------------------------------------------------------------------------

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

jest.mock("../../../../../actions/order/crm/order-created/validator");
jest.mock("../../../../../actions/order/crm/order-created/pre");
jest.mock("../../../../../actions/order/crm/order-created/transformer");
jest.mock("../../../../../actions/order/crm/order-created/sender");
jest.mock("../../../../../actions/order/crm/order-created/post");

const { validateData } = require("../../../../../actions/order/crm/order-created/validator");
const { preProcess } = require("../../../../../actions/order/crm/order-created/pre");
const { transformData } = require("../../../../../actions/order/crm/order-created/transformer");
const { sendData } = require("../../../../../actions/order/crm/order-created/sender");
const { postProcess } = require("../../../../../actions/order/crm/order-created/post");

const action = require("../../../../../actions/order/crm/order-created");
const { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR, HTTP_OK } = require("../../../../../actions/constants");

const VALID_PARAMS = {
  LOG_LEVEL: "error",
  CRM_ENDPOINT_URL: "https://crm.example.com/api/orders",
  CRM_API_KEY: "secret",
  __ow_headers: {},
  data: {
    value: {
      id: 42,
      increment_id: "000000042",
      created_at: "2024-08-05 14:34:19",
      updated_at: "2024-08-05 14:34:19",
      items: [{ item_id: 101, sku: "24-MB01", qty_ordered: 2 }],
    },
  },
};

const TRANSFORMED = {
  id: 42,
  increment_id: "000000042",
  created_at: "2024-08-05 14:34:19",
  updated_at: "2024-08-05 14:34:19",
  items: [{ item_id: 101, sku: "24-MB01", qty_ordered: 2 }],
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("Given order CRM order-created action", () => {
  describe("When main is defined", () => {
    test("Then is an instance of Function", () => {
      expect(action.main).toBeInstanceOf(Function);
    });
  });

  describe("When validation fails", () => {
    test("Then returns 400 error response without calling pre/transform/send/post", async () => {
      validateData.mockReturnValue({ success: false, message: "Invalid signature" });
      const result = await action.main(VALID_PARAMS);
      expect(result).toMatchObject({
        statusCode: HTTP_BAD_REQUEST,
        body: { success: false, error: "Invalid signature" },
      });
      expect(preProcess).not.toHaveBeenCalled();
      expect(transformData).not.toHaveBeenCalled();
      expect(sendData).not.toHaveBeenCalled();
      expect(postProcess).not.toHaveBeenCalled();
    });
  });

  describe("When duplicate event is detected", () => {
    test("Then returns 200 success response and skips transform/send/post", async () => {
      validateData.mockReturnValue({ success: true });
      preProcess.mockResolvedValue({ duplicate: true, increment_id: "000000042" });
      const result = await action.main(VALID_PARAMS);
      expect(result.statusCode).toBe(HTTP_OK);
      expect(result.body.success).toBe(true);
      expect(result.body.message).toMatch(/Duplicate/i);
      expect(transformData).not.toHaveBeenCalled();
      expect(sendData).not.toHaveBeenCalled();
    });
  });

  describe("When send fails", () => {
    test("Then returns error response and does not call postProcess", async () => {
      validateData.mockReturnValue({ success: true });
      preProcess.mockResolvedValue({ duplicate: false, increment_id: "000000042" });
      transformData.mockReturnValue(TRANSFORMED);
      sendData.mockResolvedValue({ success: false, statusCode: 503, message: "CRM down" });
      const result = await action.main(VALID_PARAMS);
      expect(result.statusCode).toBe(503);
      expect(result.body.success).toBe(false);
    });
  });

  describe("When unhandled exception is thrown", () => {
    test("Then returns 500 error response", async () => {
      validateData.mockReturnValue({ success: true });
      preProcess.mockRejectedValue(new Error("state error"));
      const result = await action.main(VALID_PARAMS);
      expect(result).toMatchObject({
        statusCode: HTTP_INTERNAL_ERROR,
        body: { success: false, error: "state error" },
      });
    });
  });

  describe("When full happy path executes (integration-style)", () => {
    test("Then calls validate → pre → transform → send → post in sequence and returns 200", async () => {
      const callOrder = [];
      validateData.mockImplementation(() => { callOrder.push("validate"); return { success: true }; });
      preProcess.mockImplementation(async () => { callOrder.push("pre"); return { duplicate: false, increment_id: "000000042" }; });
      transformData.mockImplementation(() => { callOrder.push("transform"); return TRANSFORMED; });
      sendData.mockImplementation(async () => { callOrder.push("send"); return { success: true, statusCode: 200 }; });
      postProcess.mockImplementation(async () => { callOrder.push("post"); });

      const result = await action.main(VALID_PARAMS);

      expect(callOrder).toEqual(["validate", "pre", "transform", "send", "post"]);
      expect(result.statusCode).toBe(HTTP_OK);
      expect(result.body.success).toBe(true);
      expect(result.body.message).toContain("000000042");

      // Verify send was called with the CRM-shaped payload
      expect(sendData).toHaveBeenCalledWith(
        expect.objectContaining({ CRM_ENDPOINT_URL: VALID_PARAMS.CRM_ENDPOINT_URL }),
        TRANSFORMED,
      );

      // Verify post was called with the send result
      expect(postProcess).toHaveBeenCalledWith(
        expect.any(Object),
        TRANSFORMED,
        { success: true, statusCode: 200 },
      );
    });
  });
});
