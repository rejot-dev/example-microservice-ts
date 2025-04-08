import { useQuery } from "@tanstack/react-query";

// Type for the expected response from a single /status endpoint
type SyncStatusResponse = "ready" | "initializing";
type SyncStatus = SyncStatusResponse | "unreachable";

type SyncServices = "sync-a" | "sync-b";

const STATUS_URLS: Record<SyncServices, string> = {
  "sync-a": "/sync/sync-a/status",
  "sync-b": "/sync/sync-b/status",
};

// Fetch status from all defined URLs
const fetchStatus = async (): Promise<Record<string, SyncStatus>> => {
  const entries = Object.entries(STATUS_URLS);

  const results = await Promise.allSettled(
    entries.map(async ([key, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Basic validation, assuming the server sends the correct format
        const data = await response.json();
        if (data && (data.state === "ready" || data.state === "initializing")) {
          return { key, state: data.state };
        }
        throw new Error("Invalid response format");
      } catch (error) {
        console.error(`Failed to fetch status for ${key} from ${url}:`, error);
        // Throw a specific error object to be caught in the settled result
        throw {
          key,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );

  // Process the settled results
  const statusObject = {} as Record<string, SyncStatus>;
  results.forEach((result, index) => {
    const key = entries[index][0] as keyof typeof STATUS_URLS; // Get the original key
    if (result.status === "fulfilled") {
      statusObject[key] = result.value.state;
    } else {
      // Log the specific error if needed (already logged in the catch block above)
      // console.error(`Error fetching ${key}:`, result.reason.error);
      statusObject[key] = "unreachable"; // Assign 'unreachable' state
    }
  });

  return statusObject;
};

function SyncStatusSidebar() {
  const {
    data: status,
    error: queryError, // Rename to avoid conflict with status.error
    isLoading,
  } = useQuery<Record<string, SyncStatus>, Error>({
    queryKey: ["syncStatus"],
    queryFn: fetchStatus,
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  // Helper to get status display classes
  const getStatusClasses = (state: SyncStatus[keyof SyncStatus]): string => {
    switch (state) {
      case "ready":
        return "bg-green-100 text-green-800";
      case "initializing":
        return "bg-yellow-100 text-yellow-800";
      case "unreachable":
      default:
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Sync Status</h2>
      {isLoading && <p className="text-gray-600">Loading status...</p>}
      {/* Display overall query error if it occurs */}
      {queryError && !isLoading && (
        <p className="text-red-600">Error fetching status: {queryError.message}</p>
      )}
      {status && !isLoading && !queryError && (
        <div className="space-y-2">
          {Object.entries(status).map(([key, state]: [string, SyncStatus]) => (
            <div key={key}>
              <span className="font-medium text-gray-700 capitalize">{key.replace("-", " ")}:</span>
              <span className={`ml-2 rounded px-2 py-0.5 text-sm ${getStatusClasses(state)}`}>
                {state}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

export default SyncStatusSidebar;
