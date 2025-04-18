import { errorToResponse } from "@example/shared/errors";
import { CreateOrderRequestSchema, CreateProductRequestSchema } from "@example/shared/orders-api";
import type { IRepo } from "./repo";

export class OrdersService {
  private server: ReturnType<typeof Bun.serve> | null = null;

  constructor(
    private repo: IRepo,
    private port: number = 3000,
  ) {}

  async start(): Promise<void> {
    this.server = Bun.serve({
      port: this.port,
      routes: {
        "/status": {
          GET: () => Response.json({ status: "OK" }),
        },

        // Order endpoints
        "/orders/:id": {
          GET: async (req) => {
            const order = await this.repo.getOrder(req.params.id);
            return Response.json(order);
          },
        },
        "/orders": {
          POST: async (req) => {
            const body = await req.json();
            const newOrder = CreateOrderRequestSchema.parse(body);
            const newOrderId = await this.repo.createOrder(newOrder);
            return Response.json(newOrderId);
          },
          GET: async () => {
            const orders = await this.repo.getOrders();
            return Response.json(orders);
          },
        },

        // Product endpoints
        "/products/:id": {
          GET: async (req) => {
            const product = await this.repo.getProduct(req.params.id);
            return Response.json(product);
          },
        },
        "/products": {
          POST: async (req) => {
            const body = await req.json();
            const newProduct = CreateProductRequestSchema.parse(body);
            const newProductId = await this.repo.createProduct(newProduct);
            return Response.json(newProductId);
          },
          GET: async () => {
            const products = await this.repo.getProducts();
            return Response.json(products);
          },
        },

        // Destination Accounts endpoint
        "/destination_accounts": {
          GET: async () => {
            const destinationAccounts = await this.repo.getDestinationAccounts();
            return Response.json(destinationAccounts);
          },
        },
      },
      error: errorToResponse,
    });
    console.log(`Orders service started on port ${this.port}`);
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      this.server = null;
      console.log("Orders service stopped");
    }
  }
}
