# Flash sale engine

Backend for a flash sale: atomic ordering (no oversell), idempotent retries, and one aggregation for admin metrics.

## Why this concurrency pattern

Stock is decremented with a single atomic update:

`findOneAndUpdate({ _id, stock: { $gt: 0 } }, { $inc: { stock: -1 } })`

Only documents that still have stock match the filter, so many parallel requests contend on one document and MongoDB applies updates serially—exactly one winner per available unit.

Idempotency uses a unique `idempotencyKey` on orders. Retries with the same key must not double-charge stock. The order create and stock decrement run in a **multi-document transaction** so a retry either sees the existing order or applies stock + insert once. You need a **replica set** (MongoDB Atlas is one out of the box; a single `mongod` without replica set cannot run transactions).

## Indexes (large `orders` collection)

For ~5M orders, keep the dashboard pipeline fast:

- `{ productId: 1, createdAt: 1 }` — supports `$lookup` from orders to products and per-product `firstOrderTime` / conversion metrics.
- `{ createdAt: 1 }` — time-oriented reporting if you add date filters later.
- Unique `{ idempotencyKey: 1 }` — enforced in schema; fast idempotency checks.

On `products`, `{ stock: 1 }` helps stock-health facets that filter by stock thresholds.

Always `explain("executionStats")` on staging data and add covered projections or `$match` early if a metric is scoped (e.g. last 24h).

## Setup

```bash
pnpm install
```

Create `.env`:

```env
MONGO_URI=mongodb+srv://user:pass@cluster/db
PORT=5000
```

Use a URI that points at a replica set (Atlas default).

```bash
pnpm dev
```

## API

- `POST /order/:productId` — body `{ "userId": "..." }`, header `idempotency-key` (required). `201` on success, `409` when out of stock.
- `GET /admin/dashboard` — one aggregation: revenue/volume, top 3 categories by revenue, average conversion delay (first order vs product `saleStartTime`), critical vs healthy stock lists (`stock` &lt; 10 vs ≥ 10).
- `GET /health` — liveness.

## Tests

```bash
pnpm test
```

Integration test fires many parallel order requests and asserts only `stock` successes occur. Requires a working `MONGO_URI` to a replica set.

## Scripts

| Command        | Purpose        |
|----------------|----------------|
| `pnpm dev`     | Run API        |
| `pnpm build`   | Compile to `dist` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test`    | Jest           |
