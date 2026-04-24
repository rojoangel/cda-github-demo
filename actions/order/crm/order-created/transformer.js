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

/**
 * Maps a Commerce `observer.sales_order_save_commit_after` event payload
 * to the minimal CRM order schema.
 *
 * Only the 7 guaranteed fields from EVENTS_SCHEMA.json are forwarded:
 *   id, increment_id, created_at, updated_at,
 *   items[].item_id, items[].sku, items[].qty_ordered
 *
 * @param {object} data - Raw event data from Commerce (may be wrapped in { value: {...} })
 * @returns {{ id: string|number, increment_id: string, created_at: string, updated_at: string, items: Array }}
 */
function transformData(data) {
  // The Commerce eventing module wraps the payload under a `value` key
  const source = (data && data.value) ? data.value : data;

  const items = Array.isArray(source.items)
    ? source.items.map((item) => ({
        item_id: item.item_id,
        sku: item.sku,
        qty_ordered: item.qty_ordered,
      }))
    : [];

  return {
    id: source.id,
    increment_id: source.increment_id,
    created_at: source.created_at,
    updated_at: source.updated_at,
    items,
  };
}

module.exports = { transformData };
