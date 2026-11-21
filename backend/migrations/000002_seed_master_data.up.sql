-- Default roles
INSERT INTO roles (name)
VALUES
    ('admin'),
    ('cashier');

-- Default units
INSERT INTO units (name, abbreviation)
VALUES
    ('Gram', 'g'),
    ('Kilogram', 'kg'),
    ('Milliliter', 'ml'),
    ('Liter', 'L'),
    ('Piece', 'pcs');