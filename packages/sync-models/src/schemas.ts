import { z } from "zod";

import {
  createPostgresPublicSchemaTransformation,
  createPostgresConsumerSchemaTransformation,
} from "@rejot-dev/adapter-postgres";
import { createConsumerSchema } from "@rejot-dev/contract/consumer-schema";
import { createPublicSchema } from "@rejot-dev/contract/public-schema";

const myPublicSchema = createPublicSchema("accounts-schema", {
  source: { dataStoreSlug: "accounts", tables: ["accounts"] },
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
  }),
  transformations: [
    createPostgresPublicSchemaTransformation(
      "accounts",
      `SELECT id, name FROM accounts WHERE id = $1`,
    ),
  ],
  version: {
    major: 1,
    minor: 0,
  },
});

const myConsumerSchema = createConsumerSchema({
  source: {
    manifestSlug: "my-sync-slug",
    publicSchema: {
      name: "accounts-schema",
      majorVersion: 1,
    },
  },
  destinationDataStoreSlug: "orders",
  transformations: [
    createPostgresConsumerSchemaTransformation(
      "INSERT INTO destination_accounts (id, name) VALUES (:id, :name) ON CONFLICT (id) DO UPDATE SET name = :name",
    ),
  ],
});

export default {
  myPublicSchema,
  myConsumerSchema,
};
