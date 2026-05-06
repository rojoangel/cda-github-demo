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

const { validateData } = require("./validator");

async function main(params) {
  const validation = validateData({
    payload: params?.data,
    headers: params?.headers,
    secret: params?.WEBHOOK_SECRET,
    now: params?.now,
  });

  if (!validation.success) {
    return {
      statusCode: validation.statusCode,
      body: {
        success: false,
        error: validation.message,
      },
    };
  }

  const orderId = params?.data?.order_id ?? params?.data?.entity_id;
  const createdAt = params?.data?.created_at;

  console.log(
    `Order event received: order_id=${orderId}, created_at=${createdAt}`,
  );

  return {
    statusCode: 200,
    body: {
      success: true,
      order_id: orderId,
      created_at: createdAt,
    },
  };
}

exports.main = main;
