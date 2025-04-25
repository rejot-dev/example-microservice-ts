import { z } from "zod";

import { createPostgresPublicSchemaTransformation } from "@rejot-dev/adapter-postgres";
import { createPublicSchema } from "@rejot-dev/contract/public-schema";

const accountSchema = createPublicSchema("accounts-schema", {
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

export default { accountSchema };
