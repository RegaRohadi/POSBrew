
-- =========================================
-- 1. ROLES
-- =========================================

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 2. USERS
-- =========================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 3. CATEGORIES
-- =========================================

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 4. PRODUCTS
-- =========================================

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price BIGINT NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category_id
ON products(category_id);

-- =========================================
-- 5. UNITS
-- =========================================

CREATE TABLE units (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    abbreviation VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 6. INGREDIENTS
-- =========================================

CREATE TABLE ingredients (
    id BIGSERIAL PRIMARY KEY,
    unit_id BIGINT NOT NULL REFERENCES units(id),
    name VARCHAR(150) NOT NULL UNIQUE,
    stock NUMERIC(14,3) NOT NULL DEFAULT 0
        CHECK (stock >= 0),
    minimum_stock NUMERIC(14,3) NOT NULL DEFAULT 0
        CHECK (minimum_stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingredients_unit_id
ON ingredients(unit_id);

-- =========================================
-- 7. RECIPES
-- =========================================

CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL
        REFERENCES products(id) ON DELETE RESTRICT,
    ingredient_id BIGINT NOT NULL
        REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC(14,3) NOT NULL
        CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(product_id, ingredient_id)
);

CREATE INDEX idx_recipes_ingredient_id
ON recipes(ingredient_id);

-- =========================================
-- 8. TRANSACTIONS
-- =========================================

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
    discount BIGINT NOT NULL DEFAULT 0
        CHECK (discount >= 0),
    total BIGINT NOT NULL CHECK (total >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'paid',
            'cancelled'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id
ON transactions(user_id);

CREATE INDEX idx_transactions_created_at
ON transactions(created_at);

CREATE INDEX idx_transactions_status
ON transactions(status);

-- =========================================
-- 9. TRANSACTION ITEMS
-- =========================================

CREATE TABLE transaction_items (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL
        REFERENCES transactions(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL
        REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price BIGINT NOT NULL CHECK (price >= 0),
    subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transaction_items_transaction_id
ON transaction_items(transaction_id);

CREATE INDEX idx_transaction_items_product_id
ON transaction_items(product_id);

-- =========================================
-- 10. PAYMENTS
-- =========================================

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL UNIQUE
        REFERENCES transactions(id) ON DELETE RESTRICT,
    method VARCHAR(20) NOT NULL
        CHECK (method IN ('cash', 'qris', 'debit')),
    amount BIGINT NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'success',
            'failed'
        )),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 11. STOCK MOVEMENTS
-- =========================================

CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    ingredient_id BIGINT NOT NULL
        REFERENCES ingredients(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL
        CHECK (type IN (
            'purchase',
            'sale',
            'adjustment',
            'waste',
            'reversal'
        )),
    quantity NUMERIC(14,3) NOT NULL
        CHECK (quantity > 0),
    notes TEXT,
    reference_type VARCHAR(30),
    reference_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_ingredient_id
ON stock_movements(ingredient_id);

CREATE INDEX idx_stock_movements_created_at
ON stock_movements(created_at);
