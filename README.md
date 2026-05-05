# Order Logger Extension

This App Builder project logs Commerce order modification events to the runtime console.

## Local Development

Run the project locally with:

```bash
aio app run
```

Use this to open the local UI and exercise the extension in a development environment.

## View Runtime Logs

To inspect action output and console logging:

```bash
aio app logs
```

## Deploy

Deploy the project to Adobe I/O Runtime with:

```bash
aio app deploy
```

## Verify the Event in Adobe Commerce

1. Install the extension in App Management.
2. Enable the event subscription for `observer.sales_order_save_commit_after`.
3. Save or update an order in Adobe Commerce.
4. Check the runtime logs for the order ID and timestamp output.
