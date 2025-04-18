import { z } from "zod";

/* Order Item */
export const OrderItemSchema = z.object({
  product_id: z.number(),
  quantity: z.number().int().positive(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

/* Create Order */
export const CreateOrderRequestSchema = z.object({
  account_id: z.number(),
  items: z.array(OrderItemSchema).min(1, "Orders must include at least one item"),
});

export const CreateOrderResponseSchema = z.object({
  id: z.string(),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

/* Create Product */
export const CreateProductRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number().int().positive(),
});

export const CreateProductResponseSchema = z.object({
  id: z.string(),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type CreateProductResponse = z.infer<typeof CreateProductResponseSchema>;

/* Get Order */
export const OrderItemResponseSchema = z.object({
  order_id: z.string(),
  product_id: z.string(),
  quantity: z.number(),
  price_at_time_of_order: z.coerce.number(),
});

export const GetOrderResponseSchema = z.object({
  id: z.string(),
  account_id: z.string(),
  total_price: z.coerce.number().int().positive(),
  created_at: z.coerce.date(),
  items: z.array(OrderItemResponseSchema),
});

export type GetOrderResponse = z.infer<typeof GetOrderResponseSchema>;

/* Get Product */
export const GetProductResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.coerce.number().int().positive(),
});

export type GetProductResponse = z.infer<typeof GetProductResponseSchema>;

/* Get Account */
export const GetDestinationAccountResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.coerce.date(),
  synced_at: z.coerce.date(),
});

export type GetDestinationAccountResponse = z.infer<typeof GetDestinationAccountResponseSchema>;
