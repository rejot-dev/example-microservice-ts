import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const StatusResponseSchema = z.object({
  state: z.enum(["initial", "prepared", "started", "stopped", "closed"]),
});
type SyncStatus = z.infer<typeof StatusResponseSchema>["state"] | "unreachable";

type SyncServices = "sync-a" | "sync-b";
type MicroServices = "accounts" | "orders";

const STATUS_URLS: Record<SyncServices, string> = {
  "sync-a": "/sync/sync-a/status",
  "sync-b": "/sync/sync-b/status",
};

const MICROSERVICE_URLS: Record<MicroServices, string> = {
  accounts: "/api/accounts/status",
  orders: "/api/orders/status",
};

async function fetchStatus(): Promise<{
  sync: Record<SyncServices, SyncStatus>;
  microservices: Record<MicroServices, "OK" | "unreachable">;
}> {
  const syncEntries = Object.entries(STATUS_URLS) as [SyncServices, string][];
  const microserviceEntries = Object.entries(MICROSERVICE_URLS) as [MicroServices, string][];

  const syncResults = await Promise.all(
    syncEntries.map(async ([key, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const data = StatusResponseSchema.parse(await response.json());
        return [key, data.state];
      } catch {
        return [key, "unreachable"];
      }
    }),
  );

  const microserviceResults = await Promise.all(
    microserviceEntries.map(async ([key, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const data = await response.json();
        return [key, data.status];
      } catch {
        return [key, "unreachable"];
      }
    }),
  );

  return {
    sync: Object.fromEntries(syncResults),
    microservices: Object.fromEntries(microserviceResults),
  };
}

export default function SyncStatusSidebar() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["syncStatus"],
    queryFn: fetchStatus,
    refetchInterval: 3000,
  });

  const getStatusClass = (state: SyncStatus | "OK" | "unreachable") => {
    switch (state) {
      case "started":
      case "OK":
        return "bg-green-100 text-green-800";
      case "initial":
      case "prepared":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Sync Service Status</h2>
      {isLoading && <p className="text-gray-600">Loading status...</p>}
      {status && (
        <>
          {Object.entries(status.sync).map(([key, state]) => (
            <div key={key} className="mb-2">
              <span className="font-medium text-gray-700 capitalize">{key.replace("-", " ")}:</span>
              <span className={`ml-2 rounded px-2 py-0.5 text-sm ${getStatusClass(state)}`}>
                {state}
              </span>
            </div>
          ))}

          <h2 className="mt-6 mb-4 text-lg font-semibold text-gray-800">Service Status</h2>
          {Object.entries(status.microservices).map(([key, state]) => (
            <div key={key} className="mb-2">
              <span className="font-medium text-gray-700 capitalize">{key}:</span>
              <span className={`ml-2 rounded px-2 py-0.5 text-sm ${getStatusClass(state)}`}>
                {state}
              </span>
            </div>
          ))}
        </>
      )}
    </aside>
  );
}
