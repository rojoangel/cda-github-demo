import { defineConfig } from '@adobe/aio-commerce-lib-app/config'

export default defineConfig({
  metadata: {
    id: 'order-event-logger',
    displayName: 'Order Event Logger',
    description: 'Logs Commerce order save events to the runtime console.',
    version: '1.0.0'
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: 'Adobe Commerce',
          description: 'Commerce event provider'
        },
        events: [
          {
            name: 'observer.sales_order_save_commit_after',
            label: 'Order saved after commit',
            description: 'Logs the increment_id for saved orders.',
            fields: [
              {
                name: 'increment_id'
              }
            ],
            runtimeActions: [
              'order-logger/order-logger'
            ]
          }
        ]
      }
    ]
  }
})
