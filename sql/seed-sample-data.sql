-- Seed Data for Kitchiq Product Catalogue & Default Household
INSERT INTO products (id, barcode, name, brand, category, image_url, default_location, default_unit, is_verified)
VALUES
  ('prod-milk-full', '9300601234567', 'Full Cream Milk 2L', 'Dairy Farmers', 'Dairy', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80', 'fridge', 'L', 1),
  ('prod-eggs-12', '9300607654321', 'Free Range Large Eggs 12pk', 'Sunny Queen', 'Dairy & Eggs', 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=300&q=80', 'fridge', 'pack', 1),
  ('prod-cheddar', '9310055112233', 'Tasty Cheddar Block 500g', 'Bega', 'Dairy', 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&q=80', 'fridge', 'g', 1),
  ('prod-greek-yogurt', '9310055998877', 'Greek Style Natural Yogurt 1kg', 'Chobani', 'Dairy', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80', 'fridge', 'tub', 1),
  ('prod-sourdough', '9320011445566', 'Artisan Sourdough Loaf', 'Bakers Delight', 'Bakery', 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=300&q=80', 'pantry', 'loaf', 1),
  ('prod-spaghetti', '8001250123456', 'Spaghetti No. 5 500g', 'Barilla', 'Pantry Staples', 'https://images.unsplash.com/photo-1621996346565-e3d5d62810ef?w=300&q=80', 'pantry', 'pack', 1),
  ('prod-olive-oil', '9300633112244', 'Extra Virgin Olive Oil 750ml', 'Cobram Estate', 'Pantry Staples', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80', 'pantry', 'bottle', 1),
  ('prod-cereal-oats', '9300601992211', 'Rolled Traditional Oats 1kg', 'Uncle Tobys', 'Breakfast', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80', 'pantry', 'box', 1),
  ('prod-icecream-vanilla', '9310022334455', 'Creamy Vanilla Ice Cream 2L', 'Peters', 'Frozen', 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&q=80', 'freezer', 'tub', 1),
  ('prod-frozen-peas', '9300601554433', 'Snap Frozen Baby Peas 1kg', 'Birds Eye', 'Frozen', 'https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=300&q=80', 'freezer', 'bag', 1),
  ('prod-ground-coffee', '9311223344556', 'Single Origin Ground Coffee 250g', 'Campos', 'Beverages', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&q=80', 'pantry', 'bag', 1),
  ('prod-frozen-salmon', '9345678901234', 'Atlantic Salmon Fillets 4pk', 'Tassal', 'Seafood', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&q=80', 'freezer', 'pack', 1);
