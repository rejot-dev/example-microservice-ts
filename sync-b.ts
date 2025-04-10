import {
  createPostgresPublicSchemaTransformation,
  createPostgresConsumerSchemaTransformation,
} from "@rejot-dev/adapter-postgres";
import { createConsumerSchema } from "@rejot-dev/contract/consumer-schema";
import { createPublicSchema } from "@rejot-dev/contract/public-schema";
import { z } from "zod";

const accountsConsumerSchema = createConsumerSchema({
  sourceManifestSlug: "sync-a",
  publicSchema: {
    name: "accounts",
    majorVersion: 2,
  },
  destinationDataStoreSlug: "db-orders",
  transformations: [
    createPostgresConsumerSchemaTransformation(
      "INSERT INTO destination_accounts (id, email) VALUES ($1, $2)",
    ),
  ],
});

const ordersPublicSchema = createPublicSchema("orders", {
  source: { dataStoreSlug: "db-orders", tables: ["orders"] },
  outputSchema: z.object({
    id: z.number(),
    account_id: z.number(),
    total_price: z.number(),
    items: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        price_at_time_of_order: z.number(),
        quantity: z.number(),
      }),
    ),
    created_at: z.date(),
  }),
  transformation: createPostgresPublicSchemaTransformation(
    "orders",
    `SELECT
      orders.id,
      orders.account_id,
      orders.total_price,
      orders.created_at,
      COALESCE(json_agg(
        json_build_object(
          'id', order_items.id,
          'name', products.name,
          'price_at_time_of_order', order_items.price_at_time_of_order,
          'quantity', order_items.quantity
        )
      ) FILTER (WHERE order_items.id IS NOT NULL), '[]'::json) as items
    FROM
      orders
      LEFT JOIN order_items ON orders.id = order_items.order_id
      LEFT JOIN products ON order_items.product_id = products.id
    WHERE
      orders.id = $1
    GROUP BY
      orders.id,
      orders.account_id,
      orders.total_price,
      orders.created_at`,
  ),
  version: {
    major: 1,
    minor: 0,
  },
});

export default {
  accountsConsumerSchema,
  ordersPublicSchema,
};
