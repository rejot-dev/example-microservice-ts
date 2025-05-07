import React from "react";
import EventsList from "../components/EventsList";

const ServiceBox: React.FC<{ title: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="min-w-[120px] rounded border p-4 text-center shadow">
    <h3 className="mb-2 font-semibold">{title}</h3>
    {children}
  </div>
);

const Arrow: React.FC<{
  direction: "right" | "down" | "left" | "up";
  className?: string;
}> = ({ direction, className }) => {
  let arrowChar = "";
  switch (direction) {
    case "right":
      arrowChar = "→";
      break;
    case "down":
      arrowChar = "↓";
      break;
    case "left":
      arrowChar = "←";
      break;
    case "up":
      arrowChar = "↑";
      break;
  }
  return <div className={`mx-4 text-2xl font-bold ${className}`}>{arrowChar}</div>;
};

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-prose p-4">
        <h1 className="mb-6 text-center text-2xl font-bold">ShopJot Example Application</h1>
        <div className="flex flex-col gap-4">
          <p>
            This webshop is architected with microservices in order to demonstrate how ReJot can be
            used as an inter-service communication tool.
          </p>

          <ul className="list-inside list-disc">
            <li>
              <strong>Accounts</strong>: service which takes care of registering accounts.
            </li>
            <li>
              <strong>Orders</strong>: service which handles new orders and products attached to
              those orders. An order is tied to an accounts, which is where the two service
              intersect.
            </li>
          </ul>

          <p>
            The accounts service exposes its accounts data through a "Public Schema" called
            "accounts" to the order service. Our two sync services then take are of giving the order
            service a consistent view of the accounts. Note that at this size a single sync service
            would have been enough but for demonstration purposes we have split them up.
          </p>

          <p>
            For demonstration purposes, all data in the databases is deleted every <b>10 minutes</b>
            .
          </p>

          {/* Diagram Flow */}
          <div className="flex flex-col">
            <div className="my-10 flex items-center justify-center space-x-4">
              <ServiceBox title="Accounts Service" />
              <div className="flex flex-col items-center">
                <span className="mb-1 text-xs">(ReJot Sync From Accounts)</span>
                <Arrow direction="right" />
              </div>
              <ServiceBox title="Event Store" />
              <div className="flex flex-col items-center">
                <span className="mb-1 text-xs">(ReJot Sync To Orders)</span>
                <Arrow direction="right" />
              </div>
              <ServiceBox title="Order Service" />
            </div>
            <div className="text-center">
              <i>Data flow</i>
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="w-full px-4">
        <h2 className="mb-4 text-xl font-semibold">Recent Events</h2>
        <h4 className="mb-4 text-sm">Note: Refreshes every 10 seconds</h4>
        <EventsList />
      </div>
    </div>
  );
};

export default HomePage;
