# Order Logger

An Adobe Commerce App Builder extension that subscribes to `observer.sales_order_save_commit_after` and logs the order increment ID to the runtime console.

## Install

```bash
npm install
```

## Deploy

```bash
aio app deploy
```

The Commerce event subscription is defined in `app.commerce.config.ts`. After deployment, register the app for the event in Adobe Developer Console or with the Adobe Commerce event subscription flow used by your environment.

## Runtime output

Example console log:

```text
Received order save event for increment_id: 100000123
```

If the event payload does not include `increment_id`, the action logs a warning and still returns `200 OK`.

## Local configuration

Copy `.env.dist` to `.env` if you want a local environment file for future credentials.
