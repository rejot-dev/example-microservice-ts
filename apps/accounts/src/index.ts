import { getEventStoreClient, initSchema } from "@example/shared/db";
import { getClient } from "@example/shared/db";
import { PostgresRepo } from "./repo";

import { AccountsService } from "./service";

// Initialize database connection and schema
const client = getClient();
const eventStoreClient = getEventStoreClient();
await client.connect();
await eventStoreClient.connect();
await initSchema(client, "./migrations");
console.log("Database initialized successfully");

const repo = new PostgresRepo(client, eventStoreClient);
const service = new AccountsService(repo);
await service.start();
