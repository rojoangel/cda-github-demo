# Order Logger

This App Builder extension listens to the `observer.sales_order_save_commit_after` Commerce event and writes the order ID to the action logs.

## Deployment

1. Install dependencies.
2. Configure the Adobe I/O Runtime namespace and runtime auth in `.env`.
3. Set `ADOBE_IO_EVENTS_CLIENT_SECRET` in `.env` to the event signing secret from Adobe Console.
4. Deploy the app with your normal App Builder workflow.

## Commerce event registration

In Commerce Admin, configure Adobe I/O Events for Commerce and subscribe to `observer.sales_order_save_commit_after`.

Use the runtime action `order-logger/order-logger` as the destination.

## Testing the flow

1. Create or save a test order in Commerce.
2. Confirm the event registration is active.
3. Review the runtime action logs.
4. Verify the order ID appears in the log entry.

## Local development secret

`ADOBE_IO_EVENTS_CLIENT_SECRET` is required for signature verification.

To obtain it:

1. Open Adobe Console.
2. Select the project and event registration.
3. Copy the event signing secret shown for the Commerce event subscription.
4. Store it in `.env` for local development.
