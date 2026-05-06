const crypto = require("crypto");

const { validateData } = require("../../../../actions/order/logger/validator");

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

describe("order logger validator", () => {
  const secret = "super-secret";
  const now = Date.parse("2026-05-06T12:00:00.000Z");
  const payload = {
    event: {
      name: "observer.sales_order_save_commit_after",
    },
    order_id: 1000001,
    entity_id: 1000001,
    created_at: new Date(now).toISOString(),
    updated_at: new Date(now).toISOString(),
  };

  test("accepts a valid signature", () => {
    const response = validateData({
      payload,
      headers: {
        "X-Adobe-Signature": sign(payload, secret),
      },
      secret,
      now,
    });

    expect(response).toEqual({ success: true });
  });

  test("rejects expired timestamp", () => {
    const expiredPayload = {
      ...payload,
      created_at: new Date(now - 6 * 60 * 1000).toISOString(),
    };

    const response = validateData({
      payload: expiredPayload,
      headers: {
        "X-Adobe-Signature": sign(expiredPayload, secret),
      },
      secret,
      now,
    });

    expect(response).toEqual({
      success: false,
      statusCode: 401,
      message: "Expired timestamp",
    });
  });

  test("rejects missing signature header", () => {
    const response = validateData({
      payload,
      headers: {},
      secret,
      now,
    });

    expect(response).toEqual({
      success: false,
      statusCode: 401,
      message: "Missing signature header",
    });
  });
});
