const action = require("../../../../../actions/customer/commerce/saved");
jest.mock("../../../../../actions/customer/commerce/saved/validator");
jest.mock("../../../../../actions/customer/commerce/saved/transformer");
jest.mock("../../../../../actions/customer/commerce/saved/pre");
jest.mock("../../../../../actions/customer/commerce/saved/sender");
jest.mock("../../../../../actions/customer/commerce/saved/post");

const { validateData } = require("../../../../../actions/customer/commerce/saved/validator");
const { transformData } = require("../../../../../actions/customer/commerce/saved/transformer");
const { preProcess } = require("../../../../../actions/customer/commerce/saved/pre");
const { sendData } = require("../../../../../actions/customer/commerce/saved/sender");
const { postProcess } = require("../../../../../actions/customer/commerce/saved/post");

beforeAll(() => {
  process.env.__AIO_DEV = "false";
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

const baseParams = {
  data: {
    value: {
      id: 123,
      email: "john.doe@example.com",
      firstname: "John",
      lastname: "Doe",
    },
  },
  ERP_API_URL: "https://erp.example.com/api/v1/customers",
  LOG_LEVEL: "debug",
  ENABLE_TELEMETRY: true,
};

const transformedData = {
  id: 123,
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  timestamp: "2024-01-01T00:00:00.000Z",
};

describe("Given customer commerce saved action", () => {
  describe("When method main is defined", () => {
    test("Then is an instance of Function", () => {
      expect(action.main).toBeInstanceOf(Function);
    });
  });

  describe("When validation fails", () => {
    test("Then returns 400 action error response", async () => {
      validateData.mockReturnValue({ success: false, message: "Missing id" });

      const result = await action.main(baseParams);

      expect(result.statusCode).toBe(400);
      expect(result.body.success).toBe(false);
      expect(result.body.error).toBe("Missing id");
    });
  });

  describe("When event is a duplicate (preProcess.skipped=true)", () => {
    test("Then returns 200 success without invoking sendData", async () => {
      validateData.mockReturnValue({ success: true });
      transformData.mockReturnValue(transformedData);
      preProcess.mockResolvedValue({ skipped: true, stateKey: "customer-123" });

      const result = await action.main(baseParams);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(sendData).not.toHaveBeenCalled();
    });
  });

  describe("When sendData fails", () => {
    test("Then returns error response with sendData status code", async () => {
      validateData.mockReturnValue({ success: true });
      transformData.mockReturnValue(transformedData);
      preProcess.mockResolvedValue({ skipped: false, stateKey: "customer-123" });
      sendData.mockResolvedValue({ success: false, statusCode: 502, message: "ERP timeout" });
      postProcess.mockResolvedValue(undefined);

      const result = await action.main(baseParams);

      expect(result.statusCode).toBe(502);
      expect(result.body.success).toBe(false);
      expect(result.body.error).toBe("ERP timeout");
    });
  });

  describe("When full flow succeeds", () => {
    test("Then returns 200 success response", async () => {
      validateData.mockReturnValue({ success: true });
      transformData.mockReturnValue(transformedData);
      preProcess.mockResolvedValue({ skipped: false, stateKey: "customer-123" });
      sendData.mockResolvedValue({ success: true, statusCode: 200 });
      postProcess.mockResolvedValue(undefined);

      const result = await action.main(baseParams);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(postProcess).toHaveBeenCalled();
    });
  });

  describe("When an unexpected exception is thrown", () => {
    test("Then returns 500 error response", async () => {
      validateData.mockReturnValue({ success: true });
      transformData.mockImplementation(() => {
        throw new Error("Unexpected failure");
      });

      const result = await action.main(baseParams);

      expect(result.statusCode).toBe(500);
      expect(result.body.success).toBe(false);
    });
  });
});
