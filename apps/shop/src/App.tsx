import { NavLink, Outlet, useLocation } from "react-router-dom";
import StatusSidebar from "./components/StatusSidebar";
import EventsList from "./components/EventsList";

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="flex min-h-svh flex-row bg-gray-100">
      <StatusSidebar />
      <div className="flex flex-grow flex-col p-4">
        <nav className="mb-4 rounded bg-white p-4 shadow">
          <ul className="flex space-x-4">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/accounts"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                Accounts
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                Orders
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                Products
              </NavLink>
            </li>
          </ul>
        </nav>
        <main className="h-full w-full flex-grow rounded bg-white p-6 shadow">
          {isHomePage ? (
            <Outlet />
          ) : (
            <div className="flex h-full gap-6">
              <div className="flex-1">
                <Outlet />
              </div>
              <div className="w-1/2 rounded bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-semibold">Recent Events</h2>
                <h4 className="mb-4 text-sm">Note: Refreshes every second</h4>
                <EventsList />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
