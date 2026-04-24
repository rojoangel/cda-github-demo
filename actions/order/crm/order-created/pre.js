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

const stateLib = require("@adobe/aio-lib-state");

/** Key prefix for idempotency entries */
const IDEMPOTENCY_KEY_PREFIX = "order-sync";

/**
 * Checks whether an order event has already been processed.
 *
 * Uses aio-lib-state to look up a key of the form `order-sync.{increment_id}`.
 * The separator is `.` (period) because aio-lib-state keys must be alphanumeric
 * with only `-`, `_`, or `.` — colons are not allowed.
 *
 * @param {object} params - Full action params including event data
 * @returns {{ duplicate: boolean, increment_id: string } | null}
 *   Returns an object with `duplicate: true` if the key exists,
 *   or `{ duplicate: false }` otherwise. Returns null if increment_id is unavailable.
 */
async function preProcess(params) {
  const { data } = params;
  if (!data) return null;

  const value = data.value || data;
  const incrementId = value.increment_id;
  if (!incrementId) return null;

  const state = await stateLib.init();
  const key = `${IDEMPOTENCY_KEY_PREFIX}.${incrementId}`;

  const existing = await state.get(key);
  if (existing && existing.value) {
    return { duplicate: true, increment_id: incrementId };
  }

  return { duplicate: false, increment_id: incrementId };
}

module.exports = { preProcess, IDEMPOTENCY_KEY_PREFIX };
