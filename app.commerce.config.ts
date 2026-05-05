import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "product-save-logger",
    displayName: "Product Save Logger",
    description: "Logs product save events for observer.catalog_product_save_after.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Catalog Events",
          description: "Product save events from Adobe Commerce",
        },
        events: [
          {
            name: "observer.catalog_product_save_after",
            label: "Product Save After",
            description: "Triggered after a product is saved.",
            fields: [{ name: "product_id" }],
            runtimeActions: ["product-save-logger/product-save-logger"],
          },
        ],
      },
    ],
  },
});
