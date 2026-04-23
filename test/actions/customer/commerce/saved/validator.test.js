const { validateData } = require("../../../../../actions/customer/commerce/saved/validator");

beforeAll(() => {
  process.env.__AIO_DEV = "false";
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Given customer commerce saved validator", () => {
  describe("When data is undefined", () => {
    test("Then returns validation failure", () => {
      const result = validateData(undefined);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/data.value/);
    });
  });

  describe("When data.value is missing", () => {
    test("Then returns validation failure for missing value envelope", () => {
      const result = validateData({});
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/data.value/);
    });
  });

  describe("When data.value.id is missing", () => {
    test("Then returns validation failure for missing id", () => {
      const result = validateData({ value: { email: "a@b.com" } });
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/id/);
    });
  });

  describe("When data.value.email is missing", () => {
    test("Then returns validation failure for missing email", () => {
      const result = validateData({ value: { id: 1 } });
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/email/);
    });
  });

  describe("When data.value has id=0 (falsy int edge case)", () => {
    test("Then treats id=0 as valid and passes", () => {
      const result = validateData({ value: { id: 0, email: "a@b.com" } });
      expect(result.success).toBe(true);
    });
  });

  describe("When all required fields are present", () => {
    test("Then returns success", () => {
      const result = validateData({
        value: {
          id: 123,
          email: "john.doe@example.com",
          firstname: "John",
          lastname: "Doe",
        },
      });
      expect(result.success).toBe(true);
    });
  });
});
