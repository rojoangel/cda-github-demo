import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "order-logger-extension",
    displayName: "Order Logger Extension",
    description: "Logs the Commerce order increment ID when an order is saved.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Logger",
          description: "Listens for order save events and logs the order number.",
          key: "order-logger-extension",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Order Saved",
            description: "Fires after a Commerce order is saved.",
            fields: [field("increment_id")],
            runtimeActions: ["order-logger/order-logged-listener"],
          },
        ],
      },
    ],
  },
});
