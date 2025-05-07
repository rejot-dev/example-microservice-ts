import { z } from "zod";

/* Create Account */
export const CreateAccountRequestSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

export const CreateAccountResponseSchema = z.object({
  id: z.string(),
});

export type CreateAccountResponse = z.infer<typeof CreateAccountResponseSchema>;
export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>;

/* Get Account */
export const GetAccountRequestSchema = z.object({
  id: z.string(),
});

export const GetAccountResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type GetAccountResponse = z.infer<typeof GetAccountResponseSchema>;
export type GetAccountRequest = z.infer<typeof GetAccountRequestSchema>;

/* Get Events */
export const GetEventResponseSchema = z.object({
  transaction_id: z.string(),
  operation_idx: z.number(),
  operation: z.string(),
  public_schema_name: z.string(),
  public_schema_major_version: z.number(),
  public_schema_minor_version: z.number(),
  object: z.object({
    id: z.string(),
    name: z.string(),
  }),
  created_at: z.string(),
  manifest_slug: z.string(),
});

export type GetEventResponse = z.infer<typeof GetEventResponseSchema>;
