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

const crypto = require("crypto");
const {
  validateData,
  ALLOWED_EVENT_TYPES,
  MAX_EVENT_AGE_MS,
} = require("../../../../../actions/order/crm/order-created/validator");

const HMAC_SECRET = "test-secret-key";

function makeSignature(body, secret = HMAC_SECRET) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

const VALID_DATA = {
  value: {
    id: 42,
    increment_id: "000000042",
    created_at: "2024-08-05 14:34:19",
    updated_at: "2024-08-05 14:34:19",
    items: [],
  },
};

const VALID_BODY = JSON.stringify(VALID_DATA);

describe("Given order CRM validator", () => {
  describe("When validateData is defined", () => {
    test("Then is an instance of Function", () => {
      expect(validateData).toBeInstanceOf(Function);
    });
  });

  describe("When COMMERCE_EVENTING_HMAC_SECRET is set", () => {
    test("Then valid signature passes", () => {
      const params = {
        COMMERCE_EVENTING_HMAC_SECRET: HMAC_SECRET,
        __ow_body: VALID_BODY,
        __ow_headers: {
          "x-adobe-signature": makeSignature(VALID_BODY),
        },
        data: VALID_DATA,
      };
      expect(validateData(params)).toMatchObject({ success: true });
    });

    test("Then missing signature header returns error", () => {
      const params = {
        COMMERCE_EVENTING_HMAC_SECRET: HMAC_SECRET,
        __ow_body: VALID_BODY,
        __ow_headers: {},
        data: VALID_DATA,
      };
      const result = validateData(params);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/signature/i);
    });

    test("Then wrong signature returns error", () => {
      const params = {
        COMMERCE_EVENTING_HMAC_SECRET: HMAC_SECRET,
        __ow_body: VALID_BODY,
        __ow_headers: { "x-adobe-signature": "bad-signature" },
        data: VALID_DATA,
      };
      const result = validateData(params);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Invalid event signature/i);
    });
  });

  describe("When timestamp replay guard is checked", () => {
    test("Then a timestamp within 5 minutes passes", () => {
      const recentTimestamp = new Date().toISOString();
      const params = {
        __ow_headers: { "x-adobe-event-timestamp": recentTimestamp },
        data: VALID_DATA,
      };
      expect(validateData(params)).toMatchObject({ success: true });
    });

    test("Then a timestamp older than 5 minutes is rejected", () => {
      const oldTimestamp = new Date(
        Date.now() - MAX_EVENT_AGE_MS - 1000,
      ).toISOString();
      const params = {
        __ow_headers: { "x-adobe-event-timestamp": oldTimestamp },
        data: VALID_DATA,
      };
      const result = validateData(params);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/5-minute window/i);
    });
  });

  describe("When event type whitelist is checked", () => {
    test("Then an allowed event type passes", () => {
      const params = {
        __ow_headers: {
          "x-adobe-event-type": "observer.sales_order_save_commit_after",
        },
        data: VALID_DATA,
      };
      expect(validateData(params)).toMatchObject({ success: true });
    });

    test("Then a disallowed event type is rejected", () => {
      const params = {
        __ow_headers: { "x-adobe-event-type": "observer.catalog_product_save_commit_after" },
        data: VALID_DATA,
      };
      const result = validateData(params);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/not allowed/i);
    });
  });

  describe("When required payload fields are missing", () => {
    test("Then missing data returns error", () => {
      const params = { __ow_headers: {} };
      const result = validateData(params);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Missing event data payload/i);
    });

    test("Then missing id returns error", () => {
      const params = {
        __ow_headers: {},
        data: { value: { increment_id: "000000001" } },
      };
      const result = validateData(params);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/id/i);
    });

    test("Then missing increment_id returns error", () => {
      const params = {
        __ow_headers: {},
        data: { value: { id: 1 } },
      };
      const result = validateData(params);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/increment_id/i);
    });
  });

  describe("When valid params without HMAC secret are provided", () => {
    test("Then validation passes", () => {
      const params = { __ow_headers: {}, data: VALID_DATA };
      expect(validateData(params)).toMatchObject({ success: true });
    });
  });

  describe("When ALLOWED_EVENT_TYPES is exported", () => {
    test("Then it contains the correct event type", () => {
      expect(
        ALLOWED_EVENT_TYPES.has("observer.sales_order_save_commit_after"),
      ).toBe(true);
    });
  });
});
