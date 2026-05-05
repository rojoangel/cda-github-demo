# Product Log Extension

This Adobe Commerce App Builder extension listens for `observer.catalog_product_save_after` events and logs the product SKU to the runtime console.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Authenticate your App Builder workspace as needed for local development.
3. Ensure the Commerce extension is associated with your Commerce instance in App Management.

## Local Testing

Run unit tests:

```bash
npm test
```

Run the App Builder project locally:

```bash
aio app run
```

To invoke the action locally with the `wsk` CLI, use a payload similar to:

```bash
wsk action invoke product-log-extension/product-logger --param LOG_LEVEL info --param data '{"value":{"sku":"SKU-123"}}'
```

## Deployment

Deploy the app with:

```bash
aio app deploy
```

After deployment, confirm the event subscription is active in App Management and save a product in Adobe Commerce to verify the log output.

## Example Event Payload

```json
{
  "data": {
    "value": {
      "sku": "SKU-123"
    }
  }
}
```
