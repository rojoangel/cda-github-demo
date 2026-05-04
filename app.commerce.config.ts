import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "order-event-logger",
    displayName: "Order Event Logger",
    description: "Logs Commerce order save commit events for debugging and monitoring.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Event Logger",
          description: "Commerce order save commit events",
          key: "order-event-logger",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Order Save Commit After",
            description: "Logs the order increment ID after an order is saved",
            fields: [
              field("increment_id", "order.increment_id"),
              field("id", "order.id"),
              field("created_at", "order.created_at"),
            ],
            runtimeActions: ["OrderEventLogger/order-logger"],
            prioritary: true,
          },
        ],
      },
    ],
  },
});
