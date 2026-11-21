DELETE FROM units
WHERE abbreviation IN ('g', 'kg', 'ml', 'L', 'pcs');

DELETE FROM roles
WHERE name IN ('admin', 'cashier');