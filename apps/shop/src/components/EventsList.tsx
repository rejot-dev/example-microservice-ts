import { useQuery } from "@tanstack/react-query";
import React from "react";
import { GetEventResponse, getEvents } from "../lib/api";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const EventsList: React.FC = () => {
  const {
    data: events,
    isLoading,
    error,
  } = useQuery<GetEventResponse[], Error>({
    queryKey: ["events"],
    queryFn: getEvents,
    refetchInterval: 1000, // Refresh every 1 second
  });

  if (isLoading) {
    return <div>Loading events...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading events: {error.message}</div>;
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            No events found, try{" "}
            <a href="/accounts" className="text-blue-500 hover:underline">
              adding an account
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Manifest Slug</TableHead>
              <TableHead>Object</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.transaction_id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <TableCell>{event.transaction_id}</TableCell>
                <TableCell>{event.operation}</TableCell>
                <TableCell>{event.manifest_slug}</TableCell>
                <TableCell>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(event.object, null, 2)}</pre>
                </TableCell>
                <TableCell>{event.created_at.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EventsList;
