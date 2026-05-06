# Minimal Order Logger — App Builder Extension

## Overview
Real-time extension that logs order modification events to the Adobe I/O Runtime console. Triggered whenever an order is created or updated in Commerce, this lightweight handler receives the order ID and event timestamp, validates the event signature, and acknowledges receipt with console output. No external API calls, no data transformation, no storage — purely observational logging.

## Manual deployment and testing
1. Set `WEBHOOK_SECRET` in your local environment or `.env` file.
2. Deploy with `aio app deploy`.
3. Place a test order in Commerce and check the Adobe I/O Runtime logs for the order logger action output.
4. For local testing, send a signed request to the action endpoint with a JSON body containing `event.name`, `order_id`, `entity_id`, `created_at`, and `updated_at`.

### Example curl
```bash
curl -X POST "https://<your-runtime-url>" \
  -H "Content-Type: application/json" \
  -H "X-Adobe-Signature: <hmac-sha256-hex-signature>" \
  -d '{"event":{"name":"observer.sales_order_save_commit_after"},"order_id":1000001,"entity_id":1000001,"created_at":"2026-05-06T12:00:00.000Z","updated_at":"2026-05-06T12:00:00.000Z"}'
```
