# MOTIA Framework Documentation

## 1. Introduction
**MOTIA** is a modern unified backend framework designed for building APIs, event-driven workflows, and AI agents. It unifies backend primitives—APIs, queues, background jobs, and state management—into a single core concept called a **"Step"**.

It supports a code-first approach where you define logic in `*.step.ts` files, and the framework handles the orchestration, state persistence, and real-time streams.

## 2. Core Concepts

### Steps
The fundamental building block. A Step consists of:
- **Config**: Metadata defining the trigger (API, Event, Cron), input/output events, and flow membership.
- **Handler**: The function executing the business logic.

### Triggers
Steps can be triggered by:
- **API**: HTTP requests (GET, POST, etc.).
- **Event**: Internal system events emitted by other steps.
- **Cron**: Scheduled time intervals.

### State & Streams
- **State**: Built-in key-value persistence. No need for an external DB connection for simple state.
- **Streams**: Real-time data channels. Updates to a stream are instantly pushed to subscribed clients (frontend).

## 3. Syntax & Structure

Each step is defined in a file ending in `.step.ts` (or `.js`, `.py`).

### Basic Structure (TypeScript)
```typescript
import { ApiRouteConfig, EventHandlerConfig, CronConfig, Handlers } from 'motia';

// 1. Configuration
export const config: ApiRouteConfig = {
  name: 'MyStepName',      // Unique ID for the step
  type: 'api',             // 'api' | 'event' | 'cron'
  path: '/my-endpoint',    // Only for API type
  method: 'POST',          // Only for API type
  emits: ['event.name'],   // Events this step triggers
  flows: ['flow-name']     // Grouping for visualization
};

// 2. Handler
export const handler: Handlers['MyStepName'] = async (req, context) => {
  const { emit, state, streams, logger } = context;
  
  // Logic here...
  
  return { status: 200, body: { success: true } };
};
```

## 4. Step Types & Examples

### A. API Step
Handles HTTP requests.

```typescript
import { ApiRouteConfig, Handlers } from 'motia';

export const config: ApiRouteConfig = {
  name: 'SubmitOrder',
  type: 'api',
  path: '/orders',
  method: 'POST',
  emits: ['order.created'],
  flows: ['ordering']
};

export const handler: Handlers['SubmitOrder'] = async (req, { emit, state, logger }) => {
  const { productId, quantity } = req.body;
  const orderId = `ord_${Date.now()}`;
  
  const order = { id: orderId, productId, quantity, status: 'pending' };
  
  // Persist order
  await state.set('orders', orderId, order);
  
  logger.info('Order received', { orderId });
  
  // Trigger next steps
  await emit({ topic: 'order.created', data: order });
  
  return { status: 201, body: order };
};
```

### B. Event Step
Reacts to events emitted by other steps.

```typescript
import { EventHandlerConfig, Handlers } from 'motia';

export const config: EventHandlerConfig = {
  name: 'ProcessOrder',
  type: 'event',
  subscribes: ['order.created'], // Listens for this event
  emits: ['order.processed'],
  flows: ['ordering']
};

export const handler: Handlers['ProcessOrder'] = async (input, { emit, state }) => {
  const order = input; // Data from the event
  
  // Process logic...
  order.status = 'processed';
  
  await state.set('orders', order.id, order);
  
  // Emit completion
  await emit({ topic: 'order.processed', data: order });
};
```

### C. Cron Step
Runs on a schedule.

```typescript
import { CronConfig, Handlers } from 'motia';

export const config: CronConfig = {
  name: 'DailyReport',
  type: 'cron',
  cron: '0 9 * * *', // Every day at 9 AM
  emits: ['report.generated']
};

export const handler: Handlers['DailyReport'] = async ({ emit, state, logger }) => {
  const orders = await state.getGroup('orders');
  
  logger.info(`Generated report for ${Object.keys(orders).length} orders`);
  
  await emit({ topic: 'report.generated', data: { count: Object.keys(orders).length } });
};
```

## 5. Use Cases

1.  **Unified Backends**: Replace separate Lambda/Express/Queue setups with a single repo of steps.
2.  **AI Agents**: Chain steps where one step calls an LLM and emits an event for the next step to validate or act.
3.  **Real-time Dashboards**: Use `streams` to push state changes directly to the frontend without polling.
4.  **E-commerce Flows**: Order -> Payment -> Shipping workflows using event-driven steps.

## 6. Common Types & Pitfalls

### Types (Step Configuration)
| Field | Description |
| :--- | :--- |
| `type` | Must be `'api'`, `'event'`, or `'cron'`. |
| `name` | Must be unique across the project. Used for TypeScript handler inference. |
| `flows` | Array of strings to group steps in the Workbench UI. |

### Common Pitfalls ("Typos")
1.  **Mismatched Names**: The `Handlers['StepName']` generic must match the `name` in `config`.
    ```typescript
    // BAD
    export const config = { name: 'Foo', ... };
    export const handler: Handlers['Bar'] = ... // Error
    ```
2.  **Missing Export**: You must `export const config` and `export const handler`. Default exports are not supported.
3.  **Async Handlers**: Handlers should always be `async` (return a Promise).
4.  **Path Parameters**: For API routes, use Express-style paths like `/users/:id`. Access via `req.params.id`.

