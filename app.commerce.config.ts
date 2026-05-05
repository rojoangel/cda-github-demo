import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "order-event-logger",
    displayName: "Order Event Logger",
    description: "Logs the order increment ID when Commerce saves an order.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Order Event Logger",
          description: "Receives order save events from Commerce",
        },
        events: [
          {
            name: "observer.sales_order_save_commit_after",
            label: "Order save commit after",
            description: "Triggered after a sales order is committed",
            fields: [{ name: "increment_id" }],
            runtimeActions: ["order/save-logged"],
          },
        ],
      },
    ],
  },
});
