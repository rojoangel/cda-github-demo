import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "product-log-extension",
    displayName: "Product Log Extension",
    description: "Logs product save events for Adobe Commerce when products are saved.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Product Log Extension",
          description: "Logs product save events from Adobe Commerce.",
          key: "product-log-extension",
        },
        events: [
          {
            name: "observer.catalog_product_save_after",
            label: "Product saved",
            description: "Triggered when a product is saved in Adobe Commerce.",
            fields: [{ name: "sku" }],
            runtimeActions: ["product-log-extension/product-logger"],
          },
        ],
      },
    ],
  },
});
