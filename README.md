# Product Save Logger

Adobe Commerce App Builder extension that listens for `observer.catalog_product_save_after` and logs the saved product ID.

## Deployment

1. Set up your Adobe App Builder project and ensure the Commerce extension is included in `app.config.yaml`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Commerce artifacts:
   ```bash
   npx @adobe/aio-commerce-lib-app generate all
   ```
4. Deploy the app:
   ```bash
   aio app deploy
   ```

## Verify the event subscription

Use the Adobe I/O CLI to confirm the event registration and runtime wiring:

```bash
aio app config show
```

Inspect the generated Commerce manifest after running the generator to confirm `observer.catalog_product_save_after` is mapped to `product-save-logger/product-save-logger`.

## Test

Run the unit tests with:

```bash
npm test
```

You can also invoke the action locally with a sample payload containing `product_id`:

```json
{
  "data": {
    "value": {
      "product_id": "123"
    }
  }
}
```
