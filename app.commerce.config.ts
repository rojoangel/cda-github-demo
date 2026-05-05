import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "order-logger-extension",
    displayName: "Order Logger Extension",
    description: "Logs Commerce order modification events to the runtime console.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Logger Events",
          description: "Order modification events for runtime logging.",
          key: "order-logger-events",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Order Modified",
            description: "Fires after an order is saved and committed to the database.",
            fields: [field("increment_id"), field("id"), field("updated_at")],
            runtimeActions: ["order-logger/order-modified-logger"],
          },
        ],
      },
    ],
  },
});
