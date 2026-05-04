import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "order-logger-app",
    displayName: "Order Logger",
    description: "Logs Commerce order IDs from observer.sales_order_save_commit_after events.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Logger",
          description: "Receives Commerce order save events for logging.",
          key: "order-logger-provider",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Sales Order Save Commit After",
            description: "Emitted after a sales order is committed.",
            fields: [field("id"), field("increment_id")],
            runtimeActions: ["order-logger/order-logger"],
          },
        ],
      },
    ],
  },
});
