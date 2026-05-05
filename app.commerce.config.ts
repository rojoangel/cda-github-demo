import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "order-logger",
    displayName: "Order Logger",
    description: "Logs the Commerce order increment ID when an order is saved.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Logger",
          description: "Logs order save events.",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Order saved",
            description: "Triggered after a Commerce order save commit.",
            fields: [field("increment_id")],
            runtimeActions: ["order-logger/order-saved-logger"],
          },
        ],
      },
    ],
  },
});
