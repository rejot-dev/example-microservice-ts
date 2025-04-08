import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { OrdersService } from "./service";
import type { IRepo } from "./repo";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderResponse,
  CreateProductRequest,
  CreateProductResponse,
  GetProductResponse,
  OrderItem,
  GetDestinationAccountResponse,
} from "@example/shared/orders-api";
import { ResourceNotFoundError } from "@example/shared/errors";

const TEST_PORT = 4445;

class TestRepo implements IRepo {
  private nextOrderId = 1;
  private nextProductId = 1;
  orders: Record<string, GetOrderResponse> = {};
  products: Record<string, GetProductResponse> = {};

  async createOrder(order: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Verify all products exist
    for (const item of order.items) {
      if (!this.products[item.product_id.toString()]) {
        throw new ResourceNotFoundError(`Product(${item.product_id})`);
      }
    }

    const id = this.nextOrderId.toString();
    this.nextOrderId++;

    this.orders[id] = {
      id: id,
      account_id: order.account_id.toString(),
      total_price: order.items.reduce(
        (acc: number, item: OrderItem) =>
          acc + this.products[item.product_id.toString()].price * item.quantity,
        0,
      ),
      created_at: new Date(),
      items: order.items.map((item: OrderItem) => {
        const product = this.products[item.product_id.toString()];
        return {
          order_id: id,
          product_id: item.product_id.toString(),
          quantity: item.quantity,
          price_at_time_of_order: product.price,
        };
      }),
    };

    return { id: id };
  }

  async getOrder(id: string): Promise<GetOrderResponse> {
    const order = this.orders[id];
    if (!order) {
      throw new ResourceNotFoundError(`Order(${id})`);
    }
    return order;
  }

  async getOrders(): Promise<GetOrderResponse[]> {
    return Object.values(this.orders);
  }

  async createProduct(product: CreateProductRequest): Promise<CreateProductResponse> {
    const id = this.nextProductId.toString();
    this.nextProductId++;

    this.products[id] = {
      id: id,
      name: product.name,
      description: product.description || null,
      price: product.price,
    };

    return { id: id };
  }

  async getProduct(id: string): Promise<GetProductResponse> {
    const product = this.products[id];
    if (!product) {
      throw new ResourceNotFoundError(`Product(${id})`);
    }
    return product;
  }

  async getProducts(): Promise<GetProductResponse[]> {
    return Object.values(this.products);
  }

  async getAccounts(): Promise<GetDestinationAccountResponse[]> {
    return [];
  }

  reset(): void {
    this.nextOrderId = 1;
    this.nextProductId = 1;
    this.orders = {};
    this.products = {};
  }
}

describe("OrdersService", () => {
  const repo = new TestRepo();
  const service = new OrdersService(repo, TEST_PORT);

  beforeAll(async () => {
    await service.start();
  });

  afterAll(async () => {
    await service.stop();
  });

  beforeEach(() => {
    repo.reset();
  });

  test("create product returns new product id", async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/products`, {
      method: "POST",
      body: JSON.stringify({
        name: "Test Product",
        description: "A test product",
        price: 999,
      }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as CreateProductResponse;
    expect(body.id).toBe("1");
  });

  test("get product returns product details", async () => {
    // Create a product first
    const createResponse = await fetch(`http://localhost:${TEST_PORT}/products`, {
      method: "POST",
      body: JSON.stringify({
        name: "Test Product",
        description: "A test product",
        price: 999,
      }),
    });
    const { id } = (await createResponse.json()) as CreateProductResponse;

    // Get the product
    const getResponse = await fetch(`http://localhost:${TEST_PORT}/products/${id}`);
    expect(getResponse.status).toBe(200);
    const product = (await getResponse.json()) as GetProductResponse;
    expect(product).toEqual({
      id,
      name: "Test Product",
      description: "A test product",
      price: 999,
    });
  });

  test("get non-existent product returns 404", async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/products/999`);
    expect(response.status).toBe(404);
  });

  test("create order returns new order id", async () => {
    // Create a product first
    const productResponse = await fetch(`http://localhost:${TEST_PORT}/products`, {
      method: "POST",
      body: JSON.stringify({
        name: "Test Product",
        description: "A test product",
        price: 999,
      }),
    });
    const { id: productId } = (await productResponse.json()) as CreateProductResponse;

    // Create an order
    const orderResponse = await fetch(`http://localhost:${TEST_PORT}/orders`, {
      method: "POST",
      body: JSON.stringify({
        account_id: 1,
        items: [
          {
            product_id: parseInt(productId),
            quantity: 2,
          },
        ],
      }),
    });
    expect(orderResponse.status).toBe(200);
    const body = (await orderResponse.json()) as CreateOrderResponse;
    expect(body.id).toBe("1");
  });

  test("create order with non-existent product returns error", async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/orders`, {
      method: "POST",
      body: JSON.stringify({
        account_id: 1,
        items: [
          {
            product_id: 999,
            quantity: 2,
          },
        ],
      }),
    });
    expect(response.status).toBe(404);
  });

  test("get order returns order details", async () => {
    // Create a product first
    const productResponse = await fetch(`http://localhost:${TEST_PORT}/products`, {
      method: "POST",
      body: JSON.stringify({
        name: "Test Product",
        description: "A test product",
        price: 999,
      }),
    });
    const { id: productId } = (await productResponse.json()) as CreateProductResponse;

    // Create an order
    const createOrderResponse = await fetch(`http://localhost:${TEST_PORT}/orders`, {
      method: "POST",
      body: JSON.stringify({
        account_id: 1,
        items: [
          {
            product_id: parseInt(productId),
            quantity: 2,
          },
        ],
      }),
    });
    const { id: orderId } = (await createOrderResponse.json()) as CreateOrderResponse;

    // Get the order
    const getOrderResponse = await fetch(`http://localhost:${TEST_PORT}/orders/${orderId}`);
    expect(getOrderResponse.status).toBe(200);
    const order = (await getOrderResponse.json()) as GetOrderResponse;
    expect(order.id).toBe(orderId);
    expect(order.account_id).toBe("1");
    expect(order.total_price).toBe(1998);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].product_id).toBe(productId);
    expect(order.items[0].quantity).toBe(2);
  });

  test("get non-existent order returns 404", async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/orders/999`);
    expect(response.status).toBe(404);
  });

  test("order amount matches sum of item prices", async () => {
    // Define product prices and quantities in cents
    const product1Price = 10000; // e.g., $100.00
    const product2Price = 20000; // e.g., $200.00
    const product1Quantity = 2;
    const product2Quantity = 3;
    const expectedTotal = product1Price * product1Quantity + product2Price * product2Quantity;

    // Create two products with different prices
    const product1Response = await fetch(`http://localhost:${TEST_PORT}/products`, {
      method: "POST",
      body: JSON.stringify({
        name: "Product 1",
        description: "First test product",
        price: product1Price,
      }),
    });
    const { id: product1Id } = (await product1Response.json()) as CreateProductResponse;

    const product2Response = await fetch(`http://localhost:${TEST_PORT}/products`, {
      method: "POST",
      body: JSON.stringify({
        name: "Product 2",
        description: "Second test product",
        price: product2Price,
      }),
    });
    const { id: product2Id } = (await product2Response.json()) as CreateProductResponse;

    // Create an order with multiple items
    const orderResponse = await fetch(`http://localhost:${TEST_PORT}/orders`, {
      method: "POST",
      body: JSON.stringify({
        account_id: 1,
        items: [
          {
            product_id: parseInt(product1Id),
            quantity: product1Quantity,
          },
          {
            product_id: parseInt(product2Id),
            quantity: product2Quantity,
          },
        ],
      }),
    });
    const { id: orderId } = (await orderResponse.json()) as CreateOrderResponse;

    // Get the order and verify the amount
    const getOrderResponse = await fetch(`http://localhost:${TEST_PORT}/orders/${orderId}`);
    expect(getOrderResponse.status).toBe(200);
    const order = (await getOrderResponse.json()) as GetOrderResponse;

    // Calculate expected total from items
    const totalFromItems = order.items.reduce(
      (sum: number, item) => sum + item.price_at_time_of_order * item.quantity,
      0,
    );

    expect(order.total_price).toBe(totalFromItems);
    expect(order.total_price).toBe(expectedTotal);
  });

  test("get all orders returns array of orders", async () => {
    // Create a product first
    const productResponse = await fetch(`http://localhost:${TEST_PORT}/products`, {
      method: "POST",
      body: JSON.stringify({
        name: "Test Product",
        description: "A test product",
        price: 999,
      }),
    });
    const { id: productId } = (await productResponse.json()) as CreateProductResponse;

    // Create two orders
    await fetch(`http://localhost:${TEST_PORT}/orders`, {
      method: "POST",
      body: JSON.stringify({
        account_id: 1,
        items: [
          {
            product_id: parseInt(productId),
            quantity: 2,
          },
        ],
      }),
    });

    await fetch(`http://localhost:${TEST_PORT}/orders`, {
      method: "POST",
      body: JSON.stringify({
        account_id: 2,
        items: [
          {
            product_id: parseInt(productId),
            quantity: 3,
          },
        ],
      }),
    });

    // Get all orders
    const response = await fetch(`http://localhost:${TEST_PORT}/orders`);
    expect(response.status).toBe(200);
    const orders = (await response.json()) as GetOrderResponse[];
    expect(orders).toHaveLength(2);
    expect(orders[0].account_id).toBe("1");
    expect(orders[1].account_id).toBe("2");
  });
});
