import { z } from "zod";

import { createPostgresPublicSchemaTransformation } from "@rejot-dev/adapter-postgres";
import { createPublicSchema } from "@rejot-dev/contract/public-schema";

const accountsPublicSchemaV1 = createPublicSchema("accounts", {
  source: { dataStoreSlug: "db-accounts", tables: ["accounts"] },
  outputSchema: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    created_at: z.date(),
  }),
  transformations: [
    createPostgresPublicSchemaTransformation(
      "accounts",
      "SELECT id, email, name, created_at FROM accounts WHERE id = $1",
    ),
  ],
  version: {
    major: 1,
    minor: 0,
  },
});

const accountsPublicSchemaV2 = createPublicSchema("accounts", {
  source: { dataStoreSlug: "db-accounts", tables: ["accounts"] },
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    created_at: z.date(),
  }),
  transformations: [
    createPostgresPublicSchemaTransformation(
      "accounts",
      "SELECT id, name, created_at FROM accounts WHERE id = $1",
    ),
  ],
  version: {
    major: 2,
    minor: 0,
  },
});

export default {
  accountsPublicSchemaV1,
  accountsPublicSchemaV2,
};
