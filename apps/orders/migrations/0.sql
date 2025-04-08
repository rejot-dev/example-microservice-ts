-- Destination Accounts table (synced from accounts service)
CREATE TABLE destination_accounts (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);

-- Orders tables
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL,
  total_price BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price BIGINT NOT NULL -- Store price in cents or smallest unit
);

-- Order Items table (linking orders and products)
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price_at_time_of_order BIGINT NOT NULL, -- Store price paid in cents or smallest unit
  FOREIGN KEY (order_id) REFERENCES orders (id),
  FOREIGN KEY (product_id) REFERENCES products (id),
  UNIQUE (order_id, product_id) -- Prevent duplicate products in the same order
);
