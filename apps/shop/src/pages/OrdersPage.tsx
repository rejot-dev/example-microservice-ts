import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrders,
  createOrder,
  getProducts, // Need products for the form
  getDestinationAccounts,
  CreateOrderRequest,
  GetOrderResponse,
  GetProductResponse,
  GetDestinationAccountResponse,
} from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"; // Assuming Select component exists

interface OrderItemForm {
  product_id: string; // Use string initially from select
  quantity: string; // Use string initially from input
}

const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string>(""); // Use string for select value
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([
    { product_id: "", quantity: "1" },
  ]);

  // Fetch orders
  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery<GetOrderResponse[], Error>({ queryKey: ["orders"], queryFn: getOrders });

  // Fetch products for the order form dropdown
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery<GetProductResponse[], Error>({ queryKey: ["products"], queryFn: getProducts });

  // Fetch accounts for the order form dropdown
  const {
    data: destinationAccounts,
    isLoading: isLoadingAccountsData,
    error: accountsDataError,
  } = useQuery<GetDestinationAccountResponse[], Error>({
    queryKey: ["destinationAccounts"],
    queryFn: getDestinationAccounts,
  });

  // Mutation for creating an order
  const mutation = useMutation<unknown, Error, CreateOrderRequest>({
    // Adjusted type
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSelectedAccountId("");
      setOrderItems([{ product_id: "", quantity: "1" }]);
    },
    onError: (error) => {
      console.error("Failed to create order:", error);
    },
  });

  const handleItemChange = (index: number, field: keyof OrderItemForm, value: string) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: "1" }]);
  };

  const removeItem = (index: number) => {
    if (orderItems.length <= 1) return; // Keep at least one item
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const accountIdNum = parseInt(selectedAccountId, 10);
    if (isNaN(accountIdNum)) {
      alert("Please select an account.");
      return;
    }

    const validatedItems = orderItems
      .map((item) => ({
        product_id: parseInt(item.product_id, 10),
        quantity: parseInt(item.quantity, 10),
      }))
      .filter(
        (item) =>
          !isNaN(item.product_id) &&
          item.product_id > 0 &&
          !isNaN(item.quantity) &&
          item.quantity > 0,
      );

    if (validatedItems.length === 0) {
      alert("Please add at least one valid product and quantity to the order.");
      return;
    }

    mutation.mutate({ account_id: accountIdNum, items: validatedItems });
  };

  const isLoadingDependencies = isLoadingProducts || isLoadingAccountsData;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Order</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDependencies && <p>Loading accounts and products...</p>}
          {productsError && (
            <p className="text-red-500">Error loading products: {productsError.message}</p>
          )}
          {accountsDataError && (
            <p className="text-red-500">Error loading accounts: {accountsDataError.message}</p>
          )}

          {products && destinationAccounts && (
            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Account Selection */}
              <Select
                onValueChange={setSelectedAccountId}
                value={selectedAccountId}
                required
                disabled={mutation.isPending || isLoadingDependencies}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {destinationAccounts?.map((account: GetDestinationAccountResponse) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.name} (id: {account.id}, synced_at:{" "}
                      {account.synced_at.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="font-medium">Order Items</h4>
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Select
                      value={item.product_id}
                      onValueChange={(value) => handleItemChange(index, "product_id", value)}
                      required
                      disabled={mutation.isPending}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={String(product.id)}>
                            {product.name} (${product.price.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      required
                      min="1"
                      className="w-24"
                      disabled={mutation.isPending}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={orderItems.length <= 1 || mutation.isPending}
                    >
                      -
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addItem}
                  disabled={mutation.isPending}
                >
                  Add Item
                </Button>
              </div>

              <Button type="submit" disabled={mutation.isPending || isLoadingDependencies}>
                {mutation.isPending ? "Creating..." : "Create Order"}
              </Button>
            </form>
          )}
          {mutation.error && <p className="mt-2 text-red-500">Error: {mutation.error.message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOrders && <p>Loading orders...</p>}
          {ordersError && (
            <p className="text-red-500">Error loading orders: {ordersError.message}</p>
          )}
          {orders && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.account_id}</TableCell>
                    <TableCell>${order.total_price}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <ul>
                        {order.items.map((item) => (
                          <li key={`${item.order_id}-${item.product_id}`}>
                            Product ID: {item.product_id}, Qty: {item.quantity}, Price: $
                            {item.price_at_time_of_order}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;
