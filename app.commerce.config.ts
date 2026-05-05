import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

function field(name: string, source?: string) {
  return source ? { name, source } : { name };
}

export default defineConfig({
  metadata: {
    id: "product-logger-extension",
    displayName: "Product Logger Extension",
    description: "Logs Commerce product IDs whenever a product is updated.",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Commerce Product Events",
          description: "Product lifecycle events from Adobe Commerce",
        },
        events: [
          {
            name: "plugin.magento.catalog.api.data.productinterface.save.after",
            label: "Product Saved",
            description: "Fires after a product is saved in Commerce",
            fields: [field("product_id"), field("sku"), field("name")],
            runtimeActions: ["product-logger/product-logger"],
          },
        ],
      },
    ],
  },
});
