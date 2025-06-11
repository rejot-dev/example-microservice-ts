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

1. **Build and start all services:**

   ```bash
   docker compose up -d
   ```

   This command starts all services (databases, backend services, frontend shop, and sync services) in the background.

   This automatically installs the dependencies for the sync services. You might need to run this command after the installation of dependencies, as the install might not be complete.

   To use production ports, run `docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d`.

2. **Access the shop:**
   Once the services are up (which might take a minute for health checks to pass), you can access the ShopJot frontend at [http://localhost:5173](http://localhost:5173).

3. **Stop the services:**

   ```bash
   docker compose down
   ```

## Observability

To use the observability features, you can run:

```bash
docker compose -f docker-compose.yaml -f docker-compose.telemetry.yaml up -d
```

This will start the services with the telemetry features enabled. Browse to [http://localhost:3000](http://localhost:3000) to see the Grafana interface. Inside Grafana, you can see traces and metrics in the Drilldown view. The metrics are sent every 60 seconds, so you might need to wait a bit for them to show up.

To view the traces, either use the Explore tab, or install the Traces Drilldown plugin inside Grafana.

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

1. Create the manifest files. One manifest for connection information (ending in `-docker`), and one for consumer/public schemas.
   1. `rejot-cli manifest init --slug fromaccounts --manifest rejot-manifest.from-accounts.base.json`
   2. `rejot-cli manifest init --slug from-accounts-docker --manifest rejot-manifest.from-accounts.docker.json`
   3. `rejot-cli manifest init --slug toorders --manifest rejot-manifest.to-orders.base.json` 4.`rejot-cli manifest init --slug to-orders-docker --manifest rejot-manifest.to-orders.docker.json`.
2. Define the schemas for the public and consumer schemas.
   See [`packages/sync-models/src/account-schema.ts`](./packages/sync-models/src/account-schema.ts) and [`packages/sync-models/src/order-schema.ts`](./packages/sync-models/src/order-schema.ts).
3. Run `rejot-cli collect packages/sync-models/src/account-schema.ts --manifest rejot-manifest.from-accounts.base.json --write` to create the manifest for the public schema.
4. Run `rejot-cli collect packages/sync-models/src/order-schema.ts --manifest rejot-manifest.to-orders.base.json --write` to create the manifest for the consumer schema.
5. Add the connections for databases to the manifest file, do the same for orders.

```bash
rejot-cli manifest connection add \
        --manifest rejot-manifest.from-accounts.docker.json \
        --slug "accounts" \
        --type postgres \
        --database postgres \
        --host db-accounts \
        --password postgres \
        --port 5432 \
        --user postgres

rejot-cli manifest datastore add \
            --manifest rejot-manifest.from-accounts.docker.json \
            --connection accounts \
            --publication rejot_publication \
            --slot rejot_slot
```

6. Add the connection for the eventstore to the manifest file.

```bash
rejot-cli manifest connection add \
        --manifest rejot-manifest.from-accounts.docker.json \
        --slug "eventstore" \
        --type postgres \
        --database postgres \
        --host db-eventstore \
        --password postgres \
        --port 5432 \
        --user postgres

rejot-cli manifest eventstore add \
            --manifest rejot-manifest.from-accounts.docker.json \
            --connection eventstore
```

6. Run `rejot-cli manifest sync --log-level trace rejot-manifest.from-accounts.docker.json rejot-manifest.from-accounts.base.json --api-port 3000` to synchronize the public schema.
7. Run `export REJOT_SYNC_SERVICE_fromaccounts=localhost:3000"` to link the two services
8. Run `rejot-cli manifest sync --log-level trace rejot-manifest.to-orders.docker.json rejot-manifest.to-orders.base.json --resolver env --api-port 3001` to synchronize the consumer schema.
