# Deployment and verification

1. Build and deploy the app with Adobe I/O CLI.
   - `aio app build`
   - `aio app deploy`

2. Confirm the Commerce event subscription is declared in `app.commerce.config.ts`.
   - The `observer.sales_order_save_commit_after` event is bound to `OrderEventLogger/order-event-handler`.

3. Verify order events in the runtime console.
   - Place or save an order in Commerce.
   - Open App Builder logs in Adobe Developer Console.
   - Confirm the log entry contains the order `id` and `increment_id`.
