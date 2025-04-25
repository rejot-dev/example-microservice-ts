import { createPostgresConsumerSchemaTransformation } from "@rejot-dev/adapter-postgres";
import { createConsumerSchema } from "@rejot-dev/contract/consumer-schema";

const orderSchema = createConsumerSchema({
  source: {
    manifestSlug: "from-accounts",
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
  orderSchema,
};
