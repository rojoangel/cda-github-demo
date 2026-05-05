import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

const actionName = "order-logged";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "order-logger-extension",
    displayName: "Order Logger Extension",
    description: "Logs order increment IDs from the sales_order_save_commit_after observer event.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Logger",
          description: "Logs order save events from Commerce",
          key: "order-logger-extension",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Order Saved",
            description: "Fires after an order is saved in Commerce",
            fields: [field("increment_id")],
            runtimeActions: [`OrderLogger/${actionName}`],
          },
        ],
      },
    ],
  },
});
