# ShopJot Example Application

This repository contains a demo webshop application called ShopJot, built using a microservices architecture with Typescript. It showcases how [ReJot](https://github.com/rejot-dev/rejot) can be used to synchronize data between different services.

## Architecture Overview

ShopJot consists of two main microservices:

- **Accounts Service**: Manages user account registration and address details.
- **Orders Service**: Handles product information and new orders. Orders are linked to accounts, creating a dependency between the two services.

Data synchronization between these services is managed by ReJot:

1.  The Accounts service makes its data available via a ReJot "Public Schema".
2.  **Sync Service A** (`sync-a-service`) reads changes from the Accounts database (`db-accounts`) and writes them as events to the **Event Store** (`eventstore`).
3.  **Sync Service B** (`sync-b-service`) reads events from the Event Store and applies the relevant changes to the Orders database (`db-orders`), ensuring the Orders service has a consistent view of account data.

This data flow looks like this:

`Accounts Service` → `(Sync-A)` → `Event Store` → `(Sync-B)` → `Orders Service`

See the [`docker-compose.yaml`](./docker-compose.yaml) file for details on how all these services are deployed.

## Quickstart

To get the application running locally using Docker:

1.  **Build and start all services:**

    ```bash
    docker compose up --build -d
    ```

    This command builds the necessary images (if they don't exist) and starts all services (databases, backend services, frontend shop, and sync services) in the background.

2.  **Access the shop:**
    Once the services are up (which might take a minute for health checks to pass), you can access the ShopJot frontend at [http://localhost:5173](http://localhost:5173).

3.  **Stop the services:**
    ```bash
    docker compose down
    ```

## Detailed ReJot Setup

The following steps outline how the configuration in this repo came to be.

### 1. Initialize Manifests and Connections

Define the data stores and how ReJot connects to them.

```bash
# Initialize manifest for the first sync process (Accounts -> EventStore)
bunx rejot-cli manifest init --slug "sync-a" --output sync-a.json
# Add connections to the accounts database and the event store
bunx rejot-cli manifest connection add --manifest sync-a.json --slug "db-accounts" --connection-string "postgres://postgres:postgres@db-accounts:5432/postgres"
bunx rejot-cli manifest connection add --manifest sync-a.json --slug "eventstore" --connection-string "postgres://postgres:postgres@eventstore:5432/postgres"
# Define the accounts database as a source datastore
bunx rejot-cli manifest datastore add --manifest sync-a.json --connection db-accounts
# Define the event store
bunx rejot-cli manifest eventstore add --manifest sync-a.json --connection eventstore

# Initialize manifest for the second sync process (EventStore -> Orders)
bunx rejot-cli manifest init --slug "sync-b" --output sync-b.json
# Add connections to the orders database and the event store (reusing definition)
bunx rejot-cli manifest connection add --manifest sync-b.json --slug "db-orders" --connection-string "postgres://postgres:postgres@db-orders:5432/postgres"
bunx rejot-cli manifest connection add --manifest sync-b.json --slug "eventstore" --connection-string "postgres://postgres:postgres@eventstore:5432/postgres"
# Define the orders database as a target datastore
bunx rejot-cli manifest datastore add --manifest sync-b.json --connection db-orders
# Define the event store (reusing definition)
bunx rejot-cli manifest eventstore add --manifest sync-b.json --connection eventstore --depends-on sync-a
```

_Note: The actual manifests `sync-a.json` and `sync-b.json` are already present in the repository._

### 2. Define and Collect Public and Consumer Schemas

Define which tables/columns the Accounts service should expose.
This is handled through two `sync-a.ts` and `sync-b.ts` definition files, normally for a project this small a single sync service would be fine.

```bash
bunx rejot-cli collect --write --manifest sync-a.json sync-a.ts
bunx rejot-cli collect --write --manifest sync-b.json sync-b.ts
```

### 3. Start Sync Services

If not using the main `docker compose up` command, you can start individual sync services.

Start the first sync service (Accounts -> Event Store):

```bash
docker compose up sync-a-service --build
```

This service pushes changes from `db-accounts` to the `eventstore`.

Start the second sync service (Sync A -> Orders):

```bash
# Ensure db-orders is ready first if running manually
docker compose up db-orders -d --wait
# Start the sync service
docker compose up sync-b-service --build
```

This service consumes events from the `eventstore` and updates `db-orders`.

## Debugging

### Accessing Databases

You can connect to the PostgreSQL databases running in Docker using `psql`.

For example, you can connect to the Event Store:

```bash
docker compose exec eventstore psql -U postgres -d postgres
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
