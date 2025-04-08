import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccounts, createAccount, CreateAccountRequest, GetAccountResponse } from "../lib/api";
import { Button } from "../components/ui/button"; // Use relative path
import { Input } from "../components/ui/input"; // Assuming Input component exists
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"; // Assuming Card components exist
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"; // Assuming Table components exist

const AccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountEmail, setNewAccountEmail] = useState("");

  // Fetch accounts from the Accounts service
  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    error: accountsError,
  } = useQuery<GetAccountResponse[], Error>({ queryKey: ["accounts"], queryFn: getAccounts });

  // Mutation for creating an account
  const mutation = useMutation<unknown, Error, CreateAccountRequest>({
    // Adjusted type for mutation result
    mutationFn: createAccount,
    onSuccess: () => {
      // Invalidate and refetch accounts
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setNewAccountName("");
      setNewAccountEmail("");
    },
    onError: (error) => {
      console.error("Failed to create account:", error);
      // TODO: Show user-friendly error message
    },
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName || !newAccountEmail) return;
    mutation.mutate({ name: newAccountName, email: newAccountEmail });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <Input
              type="text"
              placeholder="Account Name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              required
              disabled={mutation.isPending}
            />
            <Input
              type="email"
              placeholder="Account Email"
              value={newAccountEmail}
              onChange={(e) => setNewAccountEmail(e.target.value)}
              required
              disabled={mutation.isPending}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </form>
          {mutation.error && <p className="mt-2 text-red-500">Error: {mutation.error.message}</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Accounts Service Data</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAccounts && <p>Loading accounts...</p>}
            {accountsError && (
              <p className="text-red-500">Error loading accounts: {accountsError.message}</p>
            )}
            {accounts && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    {/* Add email if available in GetAccountResponse */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.id}</TableCell>
                      <TableCell>{account.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountsPage;
