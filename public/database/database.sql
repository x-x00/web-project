CREATE DATABASE phoneDB;
USE phoneDB;

CREATE TABLE customers(
	customer_id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(20) NOT NULL,
    last_name VARCHAR(20) NOT NULL,
    email VARCHAR(40) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    PRIMARY KEY(customer_id));
    
CREATE TABLE addresses(
    customer_id INT NOT NULL,
    city VARCHAR(20) NOT NULL,
    district VARCHAR(20) NOT NULL,
    neighborhood VARCHAR(20) NOT NULL,
    address VARCHAR(120) NOT NULL,
    PRIMARY KEY(customer_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id));
    
    
CREATE TABLE brands(
    brand_id INT NOT NULL AUTO_INCREMENT,
    brand VARCHAR(20) NOT NULL,
    PRIMARY KEY(brand_id));
    
CREATE TABLE products(
    product_id INT NOT NULL AUTO_INCREMENT,
    brand_id INT NOT NULL,
    model VARCHAR(20) NOT NULL,
    price INT NOT NULL,
    image VARCHAR(40) NOT NULL,
    stock_quantity INT NOT NULL,
    PRIMARY KEY(product_id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id));
    
CREATE TABLE cart_items(
	cart_id VARCHAR(40) NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    total INT NOT NULL,
    PRIMARY KEY(cart_id, product_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id));
    
CREATE TABLE orders(
    order_id INT NOT NULL AUTO_INCREMENT,
    customer_id INT NOT NULL,
    total_quantity INT NOT NULL,
    total_price INT NOT NULL,
    order_date DATE,
    PRIMARY KEY(order_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id));
    
CREATE TABLE ordersproducts(
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    total INT NOT NULL,
    PRIMARY KEY(order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id));
    

INSERT INTO customers (first_name, last_name, email, phone_number) VALUES 
('Su', 'Toprak', 'sutoprak@gmail.com', '01234567890'),
('Aura', 'Melodi', 'auramelodi@gmail.com', '09876543210');

INSERT INTO addresses (customer_id, country, city, district, neighborhood, street, building_name,
outdoor_number, indoor_number, postal_code) VALUES
(1, 'Turkiye', 'Istanbul', 'Beylikduzu', 'Baris', 'Ay', 'Peri', 8, 10, 34000),
(2, 'Turkiye', 'Kocaeli', 'Izmit', 'Kabaoglu', 'Serin', 'Soguk', 5, 20, 41000);

BEGIN;
INSERT INTO customers (first_name, last_name, email, phone_number)
  VALUES('idil', 'parlak', 'idilparlak@gmail.com', '5442891090');
SELECT LAST_INSERT_ID() INTO @last_customer_id;
INSERT INTO addresses (customer_id, city, district, neighborhood, address) 
  VALUES(LAST_INSERT_ID(),'istanbul', 'beylikduzu', 'baris', 'test');
INSERT INTO orders (customer_id, total_quantity, total_price, order_date)
	VALUES (@last_customer_id, (SELECT SUM(quantity) FROM cart_items WHERE cart_id='f50e5c85-85b0-41e2-a7a7-313b4c65a656'), (SELECT SUM(total) FROM cart_items WHERE cart_id='f50e5c85-85b0-41e2-a7a7-313b4c65a656'), CURRENT_DATE());
SELECT product_id, quantity, total FROM cart_items WHERE cart_id='f50e5c85-85b0-41e2-a7a7-313b4c65a656';
INSERT INTO ordersproducts (order_id, product_id, quantity, total)
	VALUES (LAST_INSERT_ID(), ()
COMMIT;

INSERT INTO brands (brand) VALUES 
('iPhone'), ('Samsung'), ('Realme');

INSERT INTO brands (brand) VALUES 
('OnePlus'), ('OPPO'), ('Vivo'), ('Xiaomi');

INSERT INTO products (brand_id, model, price, image, stock_quantity) VALUES 
(1, 'X', 12000, 'images/iPhone-X.jpg', 20),
(1, '14', 52000, 'images/iPhone-14.jpg', 10),
(2, 'S22', 22000, 'images/Samsung-S22.jpg', 30),
(2, 'A52', 16000, 'images/Samsung-A52.jpg', 25),
(3, '12', 10000, 'images/Realme-12.jpg', 40);

INSERT INTO products (brand_id, model, price, image, stock_quantity) VALUES 
(1, '11', 25000, 'images/iPhone-11.jpg', 15),
(4, '11', 45000, 'images/OnePlus-11.jpg', 10),
(5, 'A54', 9500, 'images/OPPO-A54.jpg', 50),
(2, 'Galaxy Note 10+', 35000, 'images/Samsung-GalaxyNote10Plus.jpg', 25),
(6, 'Y33s', 8300, 'images/Vivo-Y33s.jpg', 40),
(7, 'Mi 11', 34000, 'images/Xiaomi-Mi-11.jpg', 20),
(7, 'Redmi Note 10', 10000, 'images/Xiaomi-RedmiNote10.jpg', 100);

INSERT INTO cart_items (product_id, quantity, total) VALUES 
();

SELECT * FROM customers;

SELECT * FROM addresses;

SELECT * FROM orders;

SELECT * FROM ordersproducts;

SELECT * from brands;

SELECT * from products;

SELECT * FROM cart_items;

SELECT CASE
WHEN SUM(quantity) IS NULL THEN 0
ELSE SUM(quantity)
END as cart_quantity
FROM cart_items WHERE cart_id='';

SELECT NOT EXISTS (SELECT cart_id FROM cart_items WHERE cart_id='1') as isCartEmpty;

SELECT products.stock_quantity, cart_items.quantity FROM products JOIN cart_items ON products.product_id=cart_items.product_id WHERE cart_items.cart_id='3fd97bb7-548a-4b29-8f92-8c8564314858' AND cart_items.product_id=2;

SELECT products.image as image, CONCAT(brands.brand, ' ', products.model) as product, products.price as price, cart_items.quantity as quantity, cart_items.total as total FROM ((products JOIN brands ON products.brand_id=brands.brand_id) JOIN cart_items ON products.product_id=cart_items.product_id) WHERE cart_id='3fd97bb7-548a-4b29-8f92-8c8564314858';

SELECT CONCAT(SUM(total), ' ', 'TL') as total_price FROM cart_items WHERE cart_id='3fd97bb7-548a-4b29-8f92-8c8564314858';

SELECT stock_quantity FROM products WHERE product_id=2;

SELECT products.image as image, CONCAT(brands.brand, ' ', products.model) as product, products.price as price, cart_items.quantity as quantity, cart_items.total as total, products.product_id as product_id FROM ((products JOIN brands ON products.brand_id=brands.brand_id) JOIN cart_items ON products.product_id=cart_items.product_id) WHERE cart_id='0ccd8e22-9e3d-4b5e-8adc-795ac3fcafad';

TRUNCATE TABLE addresses;

TRUNCATE TABLE cart_items;

DROP TABLE customers;

DROP TABLE addresses;

DROP TABLE orders;

DROP TABLE ordersproducts;

DROP TABLE cart_items;

UPDATE products as p1 JOIN products as p2 ON p1.product_id=p2.product_id SET p1.stock_quantity=(p2.stock_quantity - 1) WHERE p1.product_id=2;

DELETE FROM cart_items WHERE cart_id='27f12589-02c3-43a1-aa36-480a6636df29';

SET SQL_SAFE_UPDATES = 0;

SELECT `AUTO_INCREMENT`
FROM  INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'phonedb'
AND   TABLE_NAME = 'customers';

ALTER TABLE cart_items
MODIFY COLUMN cart_item_id VARCHAR(40);

ALTER TABLE ordersproducts DROP COLUMN order_product_id;

ALTER TABLE ordersproducts ADD PRIMARY KEY(order_id,product_id);

ALTER TABLE cart_items DROP COLUMN cart_item_id;

ALTER TABLE cart_items ADD PRIMARY KEY (cart_id, product_id);

ALTER TABLE addresses DROP COLUMN address_id;


CREATE TABLE test(
	column_1 INT NOT NULL,
    column_2 INT NOT NULL,
    column_3 INT NOT NULL,
    PRIMARY KEY(column_1, column_2));

INSERT INTO test VALUES (1,1,1),(1,2,1);

INSERT INTO test VALUES(1,2,3);

SELECT * FROM test;

DROP TABLE test;