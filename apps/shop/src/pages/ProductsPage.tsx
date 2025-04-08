import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, createProduct, CreateProductRequest, GetProductResponse } from "../lib/api";
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

const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");

  // Fetch products
  const {
    data: products,
    isLoading,
    error,
  } = useQuery<GetProductResponse[], Error>({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  // Mutation for creating a product
  const mutation = useMutation<unknown, Error, CreateProductRequest>({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setNewProductName("");
      setNewProductPrice("");
      setNewProductDescription("");
    },
    onError: (error) => {
      console.error("Failed to create product:", error);
    },
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newProductPrice);
    if (!newProductName || isNaN(price) || price <= 0) {
      // Add some basic validation feedback
      alert("Please enter a valid product name and positive price.");
      return;
    }
    mutation.mutate({
      name: newProductName,
      price,
      description: newProductDescription || undefined, // Send undefined if empty
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <Input
              type="text"
              placeholder="Product Name"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              required
              disabled={mutation.isPending}
            />
            <Input
              type="number"
              placeholder="Price"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              required
              step="0.01"
              min="0.01"
              disabled={mutation.isPending}
            />
            <Input
              type="text"
              placeholder="Description (Optional)"
              value={newProductDescription}
              onChange={(e) => setNewProductDescription(e.target.value)}
              disabled={mutation.isPending}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          </form>
          {mutation.error && <p className="mt-2 text-red-500">Error: {mutation.error.message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading products...</p>}
          {error && <p className="text-red-500">Error loading products: {error.message}</p>}
          {products && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.description ?? "-"}</TableCell>
                    {/* Handle null description */}
                    <TableCell>{product.price}</TableCell>
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

export default ProductsPage;
