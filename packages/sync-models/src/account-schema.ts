import { z } from "zod";

import {
  createPostgresPublicSchemaTransformations,
  PostgresPublicSchemaConfigBuilder,
} from "@rejot-dev/adapter-postgres";
import { createPublicSchema } from "@rejot-dev/contract/public-schema";

const accountSchema = createPublicSchema("accounts-schema", {
  source: { dataStoreSlug: "accounts" },
  outputSchema: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
  config: new PostgresPublicSchemaConfigBuilder()
    .addTransformation([
      ...createPostgresPublicSchemaTransformations(
        "insertOrUpdate",
        "accounts",
        `SELECT a.id, a.name as "name", a.email as "email"
         FROM accounts a
         WHERE a.id = :id`,
      ),
    ])
    .build(),
  version: {
    major: 1,
    minor: 0,
  },
});

export default {
  accountSchema,
};
