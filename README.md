Order Event Logger App Builder extension.

Deployment checklist:
1. Configure the Commerce event provider and register the app in Adobe Developer Console for the target Commerce instance.
2. Deploy the app with `aio app deploy`.
3. Verify the event path by triggering a sample order save event or replaying a journaling event.
4. Confirm the runtime logs contain the order increment ID.
