import { createPostgresConsumerSchemaConfig } from "@rejot-dev/adapter-postgres";
import { createConsumerSchema } from "@rejot-dev/contract/consumer-schema";

const orderSchema = createConsumerSchema("orders-schema", {
  source: {
    manifestSlug: "fromaccounts",
    publicSchema: {
      name: "accounts-schema",
      majorVersion: 1,
    },
  },
  config: createPostgresConsumerSchemaConfig(
    "orders",
    `INSERT INTO destination_accounts
        (id, name)
      VALUES
        (:id, :name)
      ON CONFLICT (id) DO UPDATE
        SET name = :name
      ;
    `,
    {
      deleteSql: "DELETE FROM destination_accounts WHERE id = :id",
    },
  ),
});

export default {
  orderSchema,
};
