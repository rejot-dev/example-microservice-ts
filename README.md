# ShopJot Example Application

This repository contains a demo webshop application called ShopJot, built using a microservices architecture with Typescript. It showcases how [ReJot](https://github.com/rejot-dev/rejot) can be used to synchronize data between different services.

## Architecture Overview

ShopJot consists of two main microservices:

- **Accounts Service**: Manages user account registration details.
- **Orders Service**: Handles product information and new orders. Orders are linked to accounts, creating a dependency between the two services.

Data synchronization between these services is managed by ReJot:

1.  The Accounts service makes its data available via a ReJot "Public Schema".
2.  **ReJot Sync From Accounts** (`rejot-sync-from-accounts`) reads changes from the Accounts database (`db-accounts`) and writes them as events to the **Event Store** (`eventstore`).
3.  **ReJot Sync To Orders** (`rejot-sync-to-orders`) reads events from the Event Store and applies the relevant changes to the Orders database (`db-orders`), ensuring the Orders service has a consistent view of account data.

This data flow looks like this:

`Accounts Service` → `(ReJot Sync From Accounts)` → `Event Store` → `(ReJot Sync To Orders)` → `Orders Service`

See the [`docker-compose.yaml`](./docker-compose.yaml) file for details on how all these services are deployed.

## Quickstart

To get the application running locally using Docker:

1. **Install dependencies:**

   ```bash
   bun install
   ```

   The docker compose file uses this entire directory as the working directory for the rejot-sync service. As a result, you need to install dependencies before starting the services.

2. **Build and start all services:**

   ```bash
   docker compose up -d
   ```

   This command starts all services (databases, backend services, frontend shop, and sync services) in the background.

   To use production ports, run `docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d`.

3. **Access the shop:**
   Once the services are up (which might take a minute for health checks to pass), you can access the ShopJot frontend at [http://localhost:5173](http://localhost:5173).

4. **Stop the services:**

   ```bash
   docker compose down
   ```

## Debugging

### Accessing Databases

You can connect to the PostgreSQL databases running in Docker using `psql`.

For example, you can connect to the Event Store:

```bash
docker compose exec db-eventstore psql -U postgres -d postgres
```

Inside `psql`, you can inspect ReJot tables, e.g.:

```sql
-- Show events
SELECT
  *
FROM
  rejot_events.events;
```

Connecting to other databases:

```bash
docker compose exec db-accounts psql -U postgres -d postgres
docker compose exec db-orders psql -U postgres -d postgres
```

### Resetting Data

To reset all databases and Docker volumes to a clean slate:

```bash
./wipe-data.sh
```

This script stops containers, removes volumes, and cleans up ReJot state files.

## How this repository was created

1. Define the schemas for the public and consumer schemas.
   See [`packages/sync-models/src/account-schema.ts`](./packages/sync-models/src/account-schema.ts) and [`packages/sync-models/src/order-schema.ts`](./packages/sync-models/src/order-schema.ts).
2. Run `rejot-cli collect packages/sync-models/src/account-schema.ts --manifest rejot-manifest.from-accounts.json --write` to create the manifest for the public schema.
3. Run `rejot-cli collect packages/sync-models/src/order-schema.ts --manifest rejot-manifest.to-orders.json --write` to create the manifest for the consumer schema.
4. Create a new secret manifest file: `rejot-cli manifest init --slug manifest-secret`.
5. Add database and eventstore connections to the secret manifest file.

```bash
rejot-cli manifest connection add \
        --slug "my-datastore" \
        --type postgres \
        --database postgres \
        --host localhost \
        --password example \
        --port 5432 \
        --user postgres
```

6. Run `rejot-cli manifest sync --log-level trace rejot-manifest.from-accounts.json secret-manifest.json` to synchronize the public schema.
7. Run `rejot-cli manifest sync --log-level trace rejot-manifest.to-orders.json secret-manifest.json` to synchronize the consumer schema.
