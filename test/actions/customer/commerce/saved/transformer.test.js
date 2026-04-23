const { transformData } = require("../../../../../actions/customer/commerce/saved/transformer");

beforeAll(() => {
  process.env.__AIO_DEV = "false";
});

const sampleData = {
  value: {
    id: 123,
    email: "john.doe@example.com",
    firstname: "John",
    lastname: "Doe",
  },
};

describe("Given customer commerce saved transformer", () => {
  describe("When transformData is called with a full customer payload", () => {
    test("Then maps id correctly", () => {
      const result = transformData(sampleData);
      expect(result.id).toBe(123);
    });

    test("Then maps email correctly", () => {
      const result = transformData(sampleData);
      expect(result.email).toBe("john.doe@example.com");
    });

    test("Then maps firstname to firstName", () => {
      const result = transformData(sampleData);
      expect(result.firstName).toBe("John");
    });

    test("Then maps lastname to lastName", () => {
      const result = transformData(sampleData);
      expect(result.lastName).toBe("Doe");
    });

    test("Then includes a timestamp in ISO format", () => {
      const result = transformData(sampleData);
      expect(typeof result.timestamp).toBe("string");
      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    test("Then does not include unexpected fields", () => {
      const result = transformData(sampleData);
      const keys = Object.keys(result);
      expect(keys).toEqual(["id", "email", "firstName", "lastName", "timestamp"]);
    });
  });

  describe("When firstname and lastname are absent", () => {
    test("Then defaults firstName and lastName to empty strings", () => {
      const result = transformData({ value: { id: 5, email: "a@b.com" } });
      expect(result.firstName).toBe("");
      expect(result.lastName).toBe("");
    });
  });
});
