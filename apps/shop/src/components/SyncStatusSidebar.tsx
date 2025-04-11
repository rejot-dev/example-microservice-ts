import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const StatusResponseSchema = z.object({
  state: z.enum(["initial", "prepared", "started", "stopped", "closed"]),
});
type SyncStatus = z.infer<typeof StatusResponseSchema>["state"] | "unreachable";

type SyncServices = "sync-a" | "sync-b";

const STATUS_URLS: Record<SyncServices, string> = {
  "sync-a": "/sync/sync-a/status",
  "sync-b": "/sync/sync-b/status",
};

async function fetchStatus(): Promise<Record<SyncServices, SyncStatus>> {
  const entries = Object.entries(STATUS_URLS) as [SyncServices, string][];

  const results = await Promise.all(
    entries.map(async ([key, url]) => {
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

  return Object.fromEntries(results);
}

export default function SyncStatusSidebar() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["syncStatus"],
    queryFn: fetchStatus,
    refetchInterval: 3000,
  });

  const getStatusClass = (state: SyncStatus) => {
    switch (state) {
      case "started":
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
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Sync Status</h2>
      {isLoading && <p className="text-gray-600">Loading status...</p>}
      {status &&
        Object.entries(status).map(([key, state]) => (
          <div key={key}>
            <span className="font-medium text-gray-700 capitalize">{key.replace("-", " ")}:</span>
            <span className={`ml-2 rounded px-2 py-0.5 text-sm ${getStatusClass(state)}`}>
              {state}
            </span>
          </div>
        ))}
    </aside>
  );
}
