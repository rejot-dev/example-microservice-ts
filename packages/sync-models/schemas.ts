import { z } from "zod";

// import { createPostgresPublicSchemaTransformation } from "@rejot-dev/adapter-postgres";
// import { createPublicSchema } from "@rejot-dev/contract/public-schema";

import { createPostgresPublicSchemaTransformation } from "../../../rejot/packages/adapter-postgres/src/adapter/pg-transformations";
//packages/contract/public-schema/public-schema.ts
import { createPublicSchema } from "../../../rejot/packages/contract/public-schema/public-schema";

const myPublicSchema = createPublicSchema("my-public-schema", {
  source: { dataStoreSlug: "my-db-connection", tables: ["my_table"] },
  outputSchema: z.object({ id: z.string() }),
  transformations: [
    createPostgresPublicSchemaTransformation("my_table", "SELECT id FROM my_table WHERE id = $1"),
  ],
  version: {
    major: 1,
    minor: 0,
  },
});

export default {
  myPublicSchema,
};
