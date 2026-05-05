import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "order-event-logger",
    displayName: "Order Event Logger",
    description: "Subscribes to Commerce order save events and logs order identifiers for audit and debugging.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Event Logger",
          description: "Commerce order event subscription",
          key: "order-event-logger",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Order Save Commit After",
            description: "Logs the order ID whenever Commerce finishes saving an order.",
            fields: [field("id"), field("increment_id")],
            runtimeActions: ["OrderEventLogger/order-event-handler"],
            prioritary: true,
          },
        ],
      },
    ],
  },
});
