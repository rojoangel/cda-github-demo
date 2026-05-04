import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "order-logger",
    displayName: "Order Logger",
    description: "Logs Commerce order save events to the runtime console.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Logger",
          description: "Commerce order event logging",
          key: "order-logger",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Order saved after commit",
            description: "Logs the increment ID after an order is saved",
            fields: [field("increment_id")],
            runtimeActions: ["OrderLogger/order-logger"],
          },
        ],
      },
    ],
  },
});
