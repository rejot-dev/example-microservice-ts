import { initSchema } from "@example/shared/db";
import { getClient } from "@example/shared/db";
import { PostgresRepo } from "./repo";
import { OrdersService } from "./service";

// Initialize database connection and schema
const client = getClient();
await client.connect();
await initSchema(client, "./migrations");
console.log("Database initialized successfully");

// Initialize and start the service
const repo = new PostgresRepo(client);
const service = new OrdersService(repo);
await service.start();
