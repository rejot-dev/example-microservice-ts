import { Client } from "pg";
import { ResourceNotFoundError } from "@example/shared/errors";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderItem,
  GetOrderResponse,
  CreateProductRequest,
  CreateProductResponse,
  GetProductResponse,
  GetDestinationAccountResponse,
} from "@example/shared/orders-api";

export interface IRepo {
  // Order methods
  createOrder(order: CreateOrderRequest): Promise<CreateOrderResponse>;
  getOrder(id: string): Promise<GetOrderResponse>;
  getOrders(): Promise<GetOrderResponse[]>;

  // Product methods
  createProduct(product: CreateProductRequest): Promise<CreateProductResponse>;
  getProduct(id: string): Promise<GetProductResponse>;
  getProducts(): Promise<GetProductResponse[]>;

  // Account methods
  getDestinationAccounts(): Promise<GetDestinationAccountResponse[]>;
}

export class PostgresRepo implements IRepo {
  constructor(private client: Client) {}

  // Order methods
  async createOrder(order: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      await this.client.query("BEGIN");

      // The accounts are streamed here by a sync service, this means that this table is
      // eventually consistent and there is a possibility that the account does not exist yet.
      const accountResult = await this.client.query(
        "SELECT id FROM destination_accounts WHERE id = $1",
        [order.account_id],
      );

      if (accountResult.rows.length === 0) {
        throw new ResourceNotFoundError(`Account(${order.account_id})`);
      }

      // Verify all products exist first and get their prices
      const productIds = [...new Set(order.items.map((item) => item.product_id))];
      const productResult = await this.client.query(
        "SELECT id, price FROM products WHERE id = ANY($1)",
        [productIds],
      );

      if (productResult.rows.length !== productIds.length) {
        const foundIds = new Set(productResult.rows.map((row) => row.id));
        const missingIds = productIds.filter((id) => !foundIds.has(id));
        throw new ResourceNotFoundError(`Products(${missingIds.join(", ")})`);
      }

      // Create a map of product prices
      const productPrices = new Map(productResult.rows.map((row) => [row.id, row.price]));

      const total_price = order.items.reduce((acc, item) => {
        const price = productPrices.get(item.product_id.toString());
        return acc + price * item.quantity;
      }, 0);

      // Create the order
      const orderResult = await this.client.query(
        "INSERT INTO orders (account_id, total_price) VALUES ($1, $2) RETURNING id",
        [order.account_id, total_price],
      );
      const orderId = orderResult.rows[0].id;

      // Create all order items
      for (const item of order.items) {
        const price = productPrices.get(item.product_id.toString());
        await this.client.query(
          "INSERT INTO order_items (order_id, product_id, quantity, price_at_time_of_order) VALUES ($1, $2, $3, $4)",
          [orderId, item.product_id, item.quantity, price],
        );
      }

      await this.client.query("COMMIT");
      return { id: orderId };
    } catch (error) {
      await this.client.query("ROLLBACK");
      throw error;
    }
  }

  async getOrder(id: string): Promise<GetOrderResponse> {
    const orderResult = await this.client.query("SELECT * FROM orders WHERE id = $1", [id]);

    if (orderResult.rows.length === 0) {
      throw new ResourceNotFoundError(`Order(${id})`);
    }

    const itemsResult = await this.client.query("SELECT * FROM order_items WHERE order_id = $1", [
      id,
    ]);

    return {
      ...orderResult.rows[0],
      items: itemsResult.rows,
    };
  }

  async getOrders(): Promise<GetOrderResponse[]> {
    const ordersResult = await this.client.query("SELECT * FROM orders");
    const orders = ordersResult.rows;

    // Get all items for all orders in a single query
    const itemsResult = await this.client.query(
      "SELECT * FROM order_items WHERE order_id = ANY($1)",
      [orders.map((order) => order.id)],
    );

    // Group items by order_id
    const itemsByOrderId = itemsResult.rows.reduce(
      (acc, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }
        acc[item.order_id].push(item);
        return acc;
      },
      {} as Record<number, OrderItem[]>,
    );

    // Attach items to each order
    return orders.map((order) => ({
      ...order,
      items: itemsByOrderId[order.id] || [],
    }));
  }

  // Product methods
  async createProduct(product: CreateProductRequest): Promise<CreateProductResponse> {
    const result = await this.client.query(
      "INSERT INTO products (name, description, price) VALUES ($1, $2, $3) RETURNING id",
      [product.name, product.description, product.price],
    );
    return { id: result.rows[0].id };
  }

  async getProduct(id: string): Promise<GetProductResponse> {
    const result = await this.client.query("SELECT * FROM products WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      throw new ResourceNotFoundError(`Product(${id})`);
    }
    return result.rows[0];
  }

  async getProducts(): Promise<GetProductResponse[]> {
    const result = await this.client.query("SELECT * FROM products");
    return result.rows;
  }

  // Account methods
  async getDestinationAccounts(): Promise<GetDestinationAccountResponse[]> {
    const result = await this.client.query(
      "SELECT id, name, created_at, synced_at FROM destination_accounts",
    );

    return result.rows;
  }
}
