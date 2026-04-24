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

const { transformData } = require("../../../../../actions/order/crm/order-created/transformer");

describe("Given order CRM transformer", () => {
  describe("When transformData is defined", () => {
    test("Then is an instance of Function", () => {
      expect(transformData).toBeInstanceOf(Function);
    });
  });

  describe("When a Commerce event payload wrapped in value is provided", () => {
    test("Then maps all 7 fields to the CRM schema correctly", () => {
      const input = {
        value: {
          id: 42,
          increment_id: "000000042",
          created_at: "2024-08-05 14:34:19",
          updated_at: "2024-08-05 14:34:20",
          items: [
            { item_id: 101, sku: "24-MB01", qty_ordered: 2, name: "Bag" },
            { item_id: 102, sku: "24-WG080", qty_ordered: 1, extra: "ignored" },
          ],
        },
      };

      const result = transformData(input);

      expect(result).toEqual({
        id: 42,
        increment_id: "000000042",
        created_at: "2024-08-05 14:34:19",
        updated_at: "2024-08-05 14:34:20",
        items: [
          { item_id: 101, sku: "24-MB01", qty_ordered: 2 },
          { item_id: 102, sku: "24-WG080", qty_ordered: 1 },
        ],
      });
    });

    test("Then extra fields on the order are NOT included", () => {
      const input = {
        value: {
          id: 1,
          increment_id: "000000001",
          created_at: "2024-01-01 00:00:00",
          updated_at: "2024-01-01 00:00:00",
          grand_total: 99.99,
          customer_email: "test@example.com",
          items: [],
        },
      };
      const result = transformData(input);
      expect(result).not.toHaveProperty("grand_total");
      expect(result).not.toHaveProperty("customer_email");
    });
  });

  describe("When payload is not wrapped in value", () => {
    test("Then reads from top-level data", () => {
      const input = {
        id: 5,
        increment_id: "000000005",
        created_at: "2024-02-01 10:00:00",
        updated_at: "2024-02-01 10:00:00",
        items: [{ item_id: 200, sku: "SKU-A", qty_ordered: 3 }],
      };
      const result = transformData(input);
      expect(result.id).toBe(5);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({ item_id: 200, sku: "SKU-A", qty_ordered: 3 });
    });
  });

  describe("When items array is absent", () => {
    test("Then items defaults to empty array", () => {
      const input = {
        value: { id: 3, increment_id: "000000003", created_at: "2024-01-01", updated_at: "2024-01-01" },
      };
      const result = transformData(input);
      expect(result.items).toEqual([]);
    });
  });
});
