import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "order-event-logger",
    displayName: "Order Event Logger",
    description: "Logs Commerce order save events for debugging and verification.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Event Logger",
          description: "Listens to order save commit events.",
          key: "order-event-logger",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Order Save Commit After",
            description: "Fires after an order is saved and committed.",
            fields: [field("increment_id"), field("id"), field("created_at")],
            runtimeActions: ["order-event-logger/order-logger"],
          },
        ],
      },
    ],
  },
});
