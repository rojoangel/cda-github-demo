import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "order-logging-extension",
    displayName: "Order Logging Extension",
    description: "Logs Commerce order modification event order IDs to the runtime console.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Logging Extension",
          description: "Order modification event logging.",
          key: "order-logging-extension",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Order Modified",
            description: "Triggered after an order is saved and committed.",
            fields: [field("order.increment_id")],
            runtimeActions: ["order-logging/order-modified-handler"],
          },
        ],
      },
    ],
  },
});
