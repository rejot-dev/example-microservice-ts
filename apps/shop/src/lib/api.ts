import {
  CreateAccountRequestSchema,
  CreateAccountRequest,
  CreateAccountResponse,
  GetAccountResponse,
  CreateAccountResponseSchema,
  GetAccountResponseSchema,
  GetEventResponse,
  GetEventResponseSchema,
} from "@example/shared/accounts-api";
import {
  CreateOrderRequestSchema,
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderResponse,
  CreateProductRequestSchema,
  CreateProductRequest,
  CreateProductResponse,
  GetProductResponse,
  GetProductResponseSchema,
  CreateOrderResponseSchema,
  CreateProductResponseSchema,
  GetOrderResponseSchema,
  GetDestinationAccountResponse,
  GetDestinationAccountResponseSchema,
} from "@example/shared/orders-api";
import { z } from "zod";

// Use relative paths for API calls, relying on the vite proxy in dev
const ACCOUNTS_SERVICE_URL = "/api/accounts";
const ORDERS_SERVICE_URL = "/api/orders";

// --- Helper Function ---
async function apiFetch<TResponse, TRequest = undefined>(
  baseUrl: string,
  path: string,
  method: "GET" | "POST",
  schema: z.ZodType<TResponse>,
  body?: TRequest,
  requestSchema?: z.ZodType<TRequest>,
): Promise<TResponse> {
  const url = `${baseUrl}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body && method === "POST") {
    if (requestSchema) {
      const validation = requestSchema.safeParse(body);
      if (!validation.success) {
        console.error("Request validation error:", validation.error.errors);
        throw new Error(`Invalid request body: ${validation.error.flatten().fieldErrors}`);
      }
      options.body = JSON.stringify(validation.data);
    } else {
      options.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status} (${method} ${url}): ${errorText}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText} ${errorText}`);
    }

    if (response.status === 204) {
      // Handle No Content response
      // Assuming schema allows for undefined or null in this case
      // This might need adjustment based on specific API behavior
      // @ts-expect-error - Handling 204 specifically
      return undefined;
    }

    const data = await response.json();
    const validation = schema.safeParse(data);

    if (!validation.success) {
      console.error("Response validation error:", validation.error.errors);
      throw new Error(`Invalid response data: ${JSON.stringify(validation.error.flatten())}`);
    }

    return validation.data;
  } catch (error) {
    console.error(`Network or fetch error (${method} ${url}):`, error);
    throw error; // Re-throw after logging
  }
}

// --- Accounts API ---
// Assuming GET /accounts exists to list all accounts
const GetAccountsResponseSchema = z.array(GetAccountResponseSchema); // Assuming GetAccountResponseSchema exists and is correct
type GetAccountsResponse = z.infer<typeof GetAccountsResponseSchema>;

export const getAccounts = (): Promise<GetAccountsResponse> =>
  apiFetch(ACCOUNTS_SERVICE_URL, "/accounts", "GET", GetAccountsResponseSchema);

export const createAccount = (data: CreateAccountRequest): Promise<CreateAccountResponse> =>
  apiFetch(
    ACCOUNTS_SERVICE_URL,
    "/accounts",
    "POST",
    CreateAccountResponseSchema,
    data,
    CreateAccountRequestSchema,
  );

// --- Orders API ---
// Products
const GetProductsResponseSchema = z.array(GetProductResponseSchema);
type GetProductsResponse = z.infer<typeof GetProductsResponseSchema>;

export const getProducts = (): Promise<GetProductsResponse> =>
  apiFetch(ORDERS_SERVICE_URL, "/products", "GET", GetProductsResponseSchema);

export const createProduct = (data: CreateProductRequest): Promise<CreateProductResponse> =>
  apiFetch(
    ORDERS_SERVICE_URL,
    "/products",
    "POST",
    CreateProductResponseSchema,
    data,
    CreateProductRequestSchema,
  );

// Orders
const GetOrdersResponseSchema = z.array(GetOrderResponseSchema);
type GetOrdersResponse = z.infer<typeof GetOrdersResponseSchema>;

export const getOrders = (): Promise<GetOrdersResponse> =>
  apiFetch(ORDERS_SERVICE_URL, "/orders", "GET", GetOrdersResponseSchema);

export const getDestinationAccounts = (): Promise<GetDestinationAccountResponse[]> =>
  apiFetch(
    ORDERS_SERVICE_URL,
    "/destination_accounts",
    "GET",
    GetDestinationAccountResponseSchema.array(),
  );

export const createOrder = (data: CreateOrderRequest): Promise<CreateOrderResponse> =>
  apiFetch(
    ORDERS_SERVICE_URL,
    "/orders",
    "POST",
    CreateOrderResponseSchema,
    data,
    CreateOrderRequestSchema,
  );

// Events (for demonstration purposes only)
export const getEvents = async (): Promise<GetEventResponse[]> => {
  const response = await apiFetch(
    ACCOUNTS_SERVICE_URL,
    "/events",
    "GET",
    GetEventResponseSchema.array(),
  );
  return response;
};

// Export types needed by UI components
export type {
  GetAccountResponse,
  GetAccountsResponse,
  CreateAccountRequest,
  GetProductResponse,
  GetProductsResponse,
  CreateProductRequest,
  GetOrderResponse,
  GetOrdersResponse,
  CreateOrderRequest,
  GetDestinationAccountResponse,
  GetEventResponse,
};
