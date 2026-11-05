-- Chuchicharas E-commerce Database Schema
-- Compatible with MySQL 8.0+ (XAMPP)

-- Create database
CREATE DATABASE IF NOT EXISTS chuchicharas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chuchicharas_db;

SET NAMES utf8mb4;

-- =============================================
-- TABLE: users
-- =============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: categories
-- =============================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    image_url MEDIUMTEXT,
    parent_id INT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: products
-- =============================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    stock_quantity INT DEFAULT 0,
    min_stock_alert INT DEFAULT 5,
    sku VARCHAR(100) UNIQUE,
    weight DECIMAL(8, 3) DEFAULT 0,
    dimensions VARCHAR(100),
    brand VARCHAR(100),
    condition_type ENUM('new', 'used', 'refurbished') DEFAULT 'new',
    warranty VARCHAR(255),
    shipping_free BOOLEAN DEFAULT FALSE,
    shipping_cost DECIMAL(8, 2) DEFAULT 0,
    rating_average DECIMAL(3, 2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_slug (slug),
    INDEX idx_category (category_id),
    INDEX idx_active (is_active),
    INDEX idx_featured (is_featured),
    INDEX idx_price (price),
    INDEX idx_brand (brand),
    FULLTEXT idx_search (name, description, short_description)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: product_images
-- =============================================
CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url MEDIUMTEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_primary (is_primary)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: product_attributes
-- =============================================
CREATE TABLE product_attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: cart_items
-- =============================================
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: orders
-- =============================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(8, 2) DEFAULT 0,
    discount_amount DECIMAL(8, 2) DEFAULT 0,
    tax_amount DECIMAL(8, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_reference VARCHAR(255),
    tracking_number VARCHAR(100) NULL,
    shipping_address JSON NOT NULL,
    billing_address JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: order_items
-- =============================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: reviews
-- =============================================
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_product_order (user_id, product_id, order_id),
    INDEX idx_product (product_id),
    INDEX idx_approved (is_approved)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: wishlist
-- =============================================
CREATE TABLE wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: address_book
-- =============================================
CREATE TABLE address_book (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('shipping', 'billing') DEFAULT 'shipping',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'México',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_default (is_default)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: coupons
-- =============================================
CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    usage_limit INT DEFAULT 0,
    usage_count INT DEFAULT 0,
    user_limit INT DEFAULT 1,
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: coupon_usage
-- =============================================
CREATE TABLE coupon_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_coupon (coupon_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- =============================================
-- INSERT INITIAL DATA
-- =============================================

-- No se crea una cuenta admin con contraseña precargada.
-- Configura ADMIN_EMAIL / ADMIN_PASSWORD y ejecuta `npm run seed:admin`.

-- Insert categories
INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active) VALUES
(23, 'Estrellas y Artículos Variados', 'estrellas-articulos-variados', 'Estrellas, puntas, varitas y artículos decorativos.', 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400', NULL, 1, 1),
(26, 'Papelería y Oficina', 'papeleria-oficina', 'Libretas, escritura, materiales escolares y manualidades.', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400', NULL, 2, 1),
(31, 'Fiesta y Regalos', 'fiesta-regalos', 'Globos, bolsas de regalo, papel y disfraces.', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400', NULL, 3, 1),
(35, 'Accesorios de Baño', 'accesorios-bano', 'Organización, cortinas, cilindros y muebles para baño.', 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400', NULL, 4, 1),
(9, 'Belleza y Cuidado Personal', 'belleza-cuidado-personal', 'Cosméticos, cuidado personal y accesorios de belleza.', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', NULL, 5, 1),
(5, 'Hogar y Electrodomésticos', 'hogar-electrodomesticos', 'Electrodomésticos, cocina, limpieza, organización y hogar.', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', NULL, 6, 1),
(8, 'Juguetes y Bebés', 'juguetes-bebes', 'Juguetes, juegos y artículos para bebés.', 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400', NULL, 7, 1),
(58, 'Tecnología y Audio', 'tecnologia-audio', 'Audio y accesorios tecnológicos.', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400', NULL, 8, 1),
(6, 'Moda y Accesorios', 'moda', 'Bolsos, calzado, calcetines y accesorios.', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', NULL, 9, 1),
(24, 'Estrellas y Decoración', 'estrellas-decoracion', NULL, NULL, 23, 1, 1),
(27, 'Libretas y Cuadernos', 'papeleria-libretas', NULL, NULL, 26, 1, 1),
(32, 'Globos y Decoración', 'fiesta-globos', NULL, NULL, 31, 1, 1),
(36, 'Organizadores y Topers', 'bano-organizadores', NULL, NULL, 35, 1, 1),
(42, 'Maquillaje', 'belleza-maquillaje', NULL, NULL, 9, 1, 1),
(48, 'Cocina', 'hogar-cocina', NULL, NULL, 5, 1, 1),
(55, 'Peluches', 'juguetes-peluches', NULL, NULL, 8, 1, 1),
(60, 'Bolsos y Carteras', 'moda-bolsos', NULL, NULL, 6, 1, 1),
(25, 'Varitas y Accesorios', 'estrellas-varitas', NULL, NULL, 23, 2, 1),
(28, 'Escritura y Colores', 'papeleria-escritura', NULL, NULL, 26, 2, 1),
(33, 'Bolsas y Papel de Regalo', 'fiesta-bolsas', NULL, NULL, 31, 2, 1),
(37, 'Cortinas de Baño', 'bano-cortinas', NULL, NULL, 35, 2, 1),
(43, 'Uñas', 'belleza-unas', NULL, NULL, 9, 2, 1),
(49, 'Limpieza', 'hogar-limpieza', NULL, NULL, 5, 2, 1),
(56, 'Juguetes', 'juguetes', NULL, NULL, 8, 2, 1),
(61, 'Cinturones y Calzado', 'moda-calzado', NULL, NULL, 6, 2, 1),
(29, 'Escolares', 'papeleria-escolares', NULL, NULL, 26, 3, 1),
(34, 'Disfraces y Accesorios', 'fiesta-disfraces', NULL, NULL, 31, 3, 1),
(38, 'Cilindros y Botellas', 'bano-cilindros', NULL, NULL, 35, 3, 1),
(44, 'Cabello', 'belleza-cabello', NULL, NULL, 9, 3, 1),
(50, 'Electrodomésticos', 'hogar-electro', NULL, NULL, 5, 3, 1),
(57, 'Bebés', 'bebes', NULL, NULL, 8, 3, 1),
(62, 'Accesorios de Cabello', 'moda-cabello', NULL, NULL, 6, 3, 1),
(30, 'Papel y Manualidades', 'papeleria-manualidades', NULL, NULL, 26, 4, 1),
(39, 'Muebles de Baño', 'bano-muebles', NULL, NULL, 35, 4, 1),
(45, 'Cuidado Personal', 'belleza-cuidado', NULL, NULL, 9, 4, 1),
(51, 'Herramientas', 'hogar-herramientas', NULL, NULL, 5, 4, 1),
(63, 'Calcetines y Medias', 'moda-calcetines', NULL, NULL, 6, 4, 1),
(40, 'Accesorios de Baño', 'bano-accesorios', NULL, NULL, 35, 5, 1),
(46, 'Accesorios de Belleza', 'belleza-accesorios', NULL, NULL, 9, 5, 1),
(52, 'Organización', 'hogar-organizacion', NULL, NULL, 5, 5, 1),
(64, 'Sombrillas', 'moda-sombrillas', NULL, NULL, 6, 5, 1),
(53, 'Decoración', 'hogar-decoracion', NULL, NULL, 5, 6, 1);

-- Insert catalog products
INSERT INTO products (name, slug, description, short_description, price, stock_quantity, min_stock_alert, sku, brand, condition_type, shipping_free, category_id, is_featured, is_active) VALUES
('PELUCHE CHANCO CON ESTRELLA', 'peluche-chanco-con-estrella', 'PELUCHE CHANCO CON ESTRELLA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Peluches', 85.00, 10, 3, '1000000000191', NULL, 'new', 0, 55, 0, 1),
('PELUCHE AZUL CON SUDADERA ESTRELLAS EN OJOS', 'peluche-azul-con-sudadera-estrellas-en-ojos', 'PELUCHE AZUL CON SUDADERA ESTRELLAS EN OJOS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Peluches', 68.00, 10, 3, '1000000001914', NULL, 'new', 0, 55, 0, 1),
('PELUCHE OSO CON SUDADERA DE ESTRELLA', 'peluche-oso-con-sudadera-de-estrella', 'PELUCHE OSO CON SUDADERA DE ESTRELLA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Peluches', 39.50, 10, 3, '1000000023398', NULL, 'new', 0, 55, 0, 1),
('TROMPO ESTRELLA ECONOMICO', 'trompo-estrella-economico', 'TROMPO ESTRELLA ECONOMICO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 12.50, 10, 3, '101018', NULL, 'new', 0, 56, 0, 1),
('VARITA LUMINOSA LUNA/ESTRELLA 8857-3', 'varita-luminosa-lunaestrella-8857-3', 'VARITA LUMINOSA LUNA/ESTRELLA 8857-3 disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Varitas y Accesorios', 17.50, 10, 3, '10317', NULL, 'new', 0, 25, 0, 1),
('ESTRELLA METALICA BRILLOSA', 'estrella-metalica-brillosa', 'ESTRELLA METALICA BRILLOSA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Estrellas y Decoración', 4.50, 10, 3, '10839', NULL, 'new', 0, 24, 0, 1),
('UNICORNIO ACOSTADO CON ESTRELLA', 'unicornio-acostado-con-estrella', 'UNICORNIO ACOSTADO CON ESTRELLA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Peluches', 130.00, 10, 3, '11063', NULL, 'new', 0, 55, 0, 1),
('TRICOLOR ESTRELLA METALICA 6 PICOS', 'tricolor-estrella-metalica-6-picos', 'TRICOLOR ESTRELLA METALICA 6 PICOS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Estrellas y Decoración', 36.80, 10, 3, '12763', NULL, 'new', 0, 24, 0, 1),
('ADORNO PARA NAVIDAD/ESTRELLA', 'adorno-para-navidadestrella', 'ADORNO PARA NAVIDAD/ESTRELLA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Estrellas y Decoración', 8.50, 10, 3, '13029', NULL, 'new', 0, 24, 0, 1),
('CAPA NEGRA CON ESTRELLAS', 'capa-negra-con-estrellas', 'CAPA NEGRA CON ESTRELLAS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Disfraces y Accesorios', 25.00, 10, 3, '13191', NULL, 'new', 0, 34, 0, 1),
('BOLSA DE REGALO ESTRELLAS', 'bolsa-de-regalo-estrellas', 'BOLSA DE REGALO ESTRELLAS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Bolsas y Papel de Regalo', 20.00, 10, 3, '2520035937', NULL, 'new', 0, 33, 0, 1),
('BOLSA DE REGALO ESTRELLAS', 'bolsa-de-regalo-estrellas-2525712912', 'BOLSA DE REGALO ESTRELLAS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Bolsas y Papel de Regalo', 15.00, 10, 3, '2525712912', NULL, 'new', 0, 33, 0, 1),
('BOLSA DE REGALO ESTRELLAS', 'bolsa-de-regalo-estrellas-5112075302', 'BOLSA DE REGALO ESTRELLAS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Bolsas y Papel de Regalo', 14.00, 10, 3, '5112075302', NULL, 'new', 0, 33, 0, 1),
('ESTRELLA BLOCK DE DIBUJO 20H AHUIJETA', 'estrella-block-de-dibujo-20h-ahuijeta', 'ESTRELLA BLOCK DE DIBUJO 20H AHUIJETA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Papel y Manualidades', 87.48, 10, 3, '602760003914', 'Estrella', 'new', 0, 30, 0, 1),
('ESTRELLA BLOCK DE DIBUJO PEGADO 20H', 'estrella-block-de-dibujo-pegado-20h', 'ESTRELLA BLOCK DE DIBUJO PEGADO 20H disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Papel y Manualidades', 91.80, 10, 3, '602760004413', 'Estrella', 'new', 0, 30, 0, 1),
('ESTRELLA LIBRETA FRANCESA MINI 100H', 'estrella-libreta-francesa-mini-100h', 'ESTRELLA LIBRETA FRANCESA MINI 100H disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Libretas y Cuadernos', 13.50, 10, 3, '602760005280', 'Estrella', 'new', 0, 27, 0, 1),
('ESTRELLA LIBRETA POKET', 'estrella-libreta-poket', 'ESTRELLA LIBRETA POKET disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Libretas y Cuadernos', 4.00, 10, 3, '602760004582', 'Estrella', 'new', 0, 27, 0, 1),
('ESTRELLA LIBRETA ITALIANA/RAYA', 'estrella-libreta-italianaraya', 'ESTRELLA LIBRETA ITALIANA/RAYA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Libretas y Cuadernos', 16.25, 10, 3, '602760001602', 'Estrella', 'new', 0, 27, 0, 1),
('ESTRELLA LIBRETA ITALIANA/DIBUJO', 'estrella-libreta-italianadibujo', 'ESTRELLA LIBRETA ITALIANA/DIBUJO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Libretas y Cuadernos', 16.25, 10, 3, '602760001640', 'Estrella', 'new', 0, 27, 0, 1),
('ESTRELLA LIBRETA ITALIANA/DOBLE RAYA', 'estrella-libreta-italianadoble-raya', 'ESTRELLA LIBRETA ITALIANA/DOBLE RAYA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Libretas y Cuadernos', 16.25, 10, 3, '602760001688', 'Estrella', 'new', 0, 27, 0, 1),
('ESTRELLA LIBRETA ITALIANA 7MM', 'estrella-libreta-italiana-7mm', 'ESTRELLA LIBRETA ITALIANA 7MM disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Libretas y Cuadernos', 16.25, 10, 3, '602760001725', 'Estrella', 'new', 0, 27, 0, 1),
('ESTRELLA LIBRETA ITALIANA 5MM', 'estrella-libreta-italiana-5mm', 'ESTRELLA LIBRETA ITALIANA 5MM disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Libretas y Cuadernos', 16.25, 10, 3, '602760004580', 'Estrella', 'new', 0, 27, 0, 1),
('ESTRELLA CUADERNO MINI RAYA PASTA DURA', 'estrella-cuaderno-mini-raya-pasta-dura', 'ESTRELLA CUADERNO MINI RAYA PASTA DURA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Libretas y Cuadernos', 25.77, 10, 3, '602760005600', 'Estrella', 'new', 0, 27, 0, 1),
('ESTRELLA HOJAS PROYECIONAL DIBUJO', 'estrella-hojas-proyecional-dibujo', 'ESTRELLA HOJAS PROYECIONAL DIBUJO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Papel y Manualidades', 17.40, 10, 3, '602760005624', 'Estrella', 'new', 0, 30, 0, 1),
('ESTRELLA HOJAS PROYECIONAL DOBLE RAYA', 'estrella-hojas-proyecional-doble-raya', 'ESTRELLA HOJAS PROYECIONAL DOBLE RAYA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Papel y Manualidades', 17.40, 10, 3, '602760005714', 'Estrella', 'new', 0, 30, 0, 1),
('ESTRELLA HOJAS DE COLORES COMBINADOS', 'estrella-hojas-de-colores-combinados', 'ESTRELLA HOJAS DE COLORES COMBINADOS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Papel y Manualidades', 17.40, 10, 3, '602760006737', 'Estrella', 'new', 0, 30, 0, 1),
('ESTRELLA LAPIZ ADHESIVO 8G', 'estrella-lapiz-adhesivo-8g', 'ESTRELLA LAPIZ ADHESIVO 8G disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Escolares', 8.14, 10, 3, '602760006556', 'Estrella', 'new', 0, 29, 0, 1),
('ESTRELLA LAPIZ ADHESIVO 21G', 'estrella-lapiz-adhesivo-21g', 'ESTRELLA LAPIZ ADHESIVO 21G disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Escolares', 14.17, 10, 3, '602760006574', 'Estrella', 'new', 0, 29, 0, 1),
('ESTRELLA COLORES MOSTER 12 PZ', 'estrella-colores-moster-12-pz', 'ESTRELLA COLORES MOSTER 12 PZ disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Escritura y Colores', 29.55, 10, 3, '602760006581', 'Estrella', 'new', 0, 28, 1, 1),
('ESTRELLA COLORES MOSTER 24 PZ', 'estrella-colores-moster-24-pz', 'ESTRELLA COLORES MOSTER 24 PZ disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Escritura y Colores', 46.75, 10, 3, '602760006542', 'Estrella', 'new', 0, 28, 0, 1),
('VARITA DE ESTRELLA/MAGIC', 'varita-de-estrellamagic', 'VARITA DE ESTRELLA/MAGIC disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Varitas y Accesorios', 6.80, 10, 3, '602796196002', NULL, 'new', 0, 25, 0, 1),
('ESTRELLA DE BELEN MULTICOLOR', 'estrella-de-belen-multicolor', 'ESTRELLA DE BELEN MULTICOLOR disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Estrellas y Decoración', 80.00, 10, 3, '602924319910', NULL, 'new', 0, 24, 0, 1),
('PUNTA DE ESTRELLA MAGICA COLOR 22L', 'punta-de-estrella-magica-color-22l', 'PUNTA DE ESTRELLA MAGICA COLOR 22L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Estrellas y Decoración', 63.70, 10, 3, '694564880163', NULL, 'new', 0, 24, 0, 1),
('PUNTA DE ESTRELLA MAGICA COLOR 10L', 'punta-de-estrella-magica-color-10l', 'PUNTA DE ESTRELLA MAGICA COLOR 10L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Estrellas y Decoración', 46.67, 10, 3, '694564880075', NULL, 'new', 0, 24, 0, 1),
('FIGURA DE PUNTA ESTRELLA COLOR 30L', 'figura-de-punta-estrella-color-30l', 'FIGURA DE PUNTA ESTRELLA COLOR 30L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Estrellas y Decoración', 56.20, 10, 3, '694564880057', NULL, 'new', 0, 24, 0, 1),
('PUNTA DE ESTRELLA COLOR 30L', 'punta-de-estrella-color-30l', 'PUNTA DE ESTRELLA COLOR 30L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Estrellas y Decoración', 59.50, 10, 3, '694564880072', NULL, 'new', 0, 24, 0, 1),
('CUCAS DE ESTRELLAS', 'cucas-de-estrellas', 'CUCAS DE ESTRELLAS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Accesorios de Cabello', 12.84, 10, 3, '697210595010', NULL, 'new', 0, 62, 0, 1),
('BROCHES CON ESTRELLAS P/CABELLO', 'broches-con-estrellas-pcabello', 'BROCHES CON ESTRELLAS P/CABELLO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Accesorios de Cabello', 10.47, 10, 3, '697545131733', NULL, 'new', 0, 62, 0, 1),
('CUCAS DE ESTRELLAS', 'cucas-de-estrellas-697545171118', 'CUCAS DE ESTRELLAS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Accesorios de Cabello', 16.80, 10, 3, '697545171118', NULL, 'new', 0, 62, 0, 1),
('PUNTA DE ESTRELLA COLOR', 'punta-de-estrella-color', 'PUNTA DE ESTRELLA COLOR disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Estrellas y Decoración', 9.45, 10, 3, '6075464517347', NULL, 'new', 0, 24, 0, 1),
('YULIANA SOPORTE SHOWER', 'yuliana-soporte-shower', 'YULIANA SOPORTE SHOWER disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Accesorios de Baño', 158.40, 10, 3, '7500864000558', 'Yuliana', 'new', 0, 40, 1, 1),
('YULIANA BOTE ACAPULCO NATURAL 40L', 'yuliana-bote-acapulco-natural-40l', 'YULIANA BOTE ACAPULCO NATURAL 40L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 227.20, 10, 3, '7500864000770', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA BOTE ACAPULCO NATURAL 40L CON LLAVE', 'yuliana-bote-acapulco-natural-40l-con-llave', 'YULIANA BOTE ACAPULCO NATURAL 40L CON LLAVE disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 299.20, 10, 3, '7500864001074', 'Yuliana', 'new', 0, 38, 1, 1),
('YULIANA TOPER CON 3 DIVISIONES', 'yuliana-toper-con-3-divisiones', 'YULIANA TOPER CON 3 DIVISIONES disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Organizadores y Topers', 84.80, 10, 3, '7500864001418', 'Yuliana', 'new', 0, 36, 0, 1),
('YULIANA CILINDRO LEXUS CROMOS 1L', 'yuliana-cilindro-lexus-cromos-1l', 'YULIANA CILINDRO LEXUS CROMOS 1L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 65.60, 10, 3, '7500864002071', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA SILLA CHILLONA', 'yuliana-silla-chillona', 'YULIANA SILLA CHILLONA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Muebles de Baño', 190.40, 10, 3, '7500864002590', 'Yuliana', 'new', 0, 39, 0, 1),
('YULIANA CILINDRO VENUS 400ML', 'yuliana-cilindro-venus-400ml', 'YULIANA CILINDRO VENUS 400ML disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 33.60, 10, 3, '7500864004532', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA COSMETIQUERA TRANSPARENTE', 'yuliana-cosmetiquera-transparente', 'YULIANA COSMETIQUERA TRANSPARENTE disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Organizadores y Topers', 57.60, 10, 3, '7500864005836', 'Yuliana', 'new', 0, 36, 0, 1),
('YULIANA TOPER FLOWER DE 4PZ', 'yuliana-toper-flower-de-4pz', 'YULIANA TOPER FLOWER DE 4PZ disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Organizadores y Topers', 41.60, 10, 3, '7500864006412', 'Yuliana', 'new', 0, 36, 0, 1),
('YULIANA TOPER DE 4PZ CON ROSCA', 'yuliana-toper-de-4pz-con-rosca', 'YULIANA TOPER DE 4PZ CON ROSCA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Organizadores y Topers', 51.20, 10, 3, '7500864007441', 'Yuliana', 'new', 0, 36, 0, 1),
('YULIANA TOPER DE 4PZ', 'yuliana-toper-de-4pz', 'YULIANA TOPER DE 4PZ disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Organizadores y Topers', 73.60, 10, 3, '7500864008134', 'Yuliana', 'new', 0, 36, 0, 1),
('YULIANA CILINDRO LEXUS 2L', 'yuliana-cilindro-lexus-2l', 'YULIANA CILINDRO LEXUS 2L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 94.40, 10, 3, '7500864008493', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA CILINDRO LEXUS TRANS 1L', 'yuliana-cilindro-lexus-trans-1l', 'YULIANA CILINDRO LEXUS TRANS 1L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 65.60, 10, 3, '7500864009100', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA CILINDRO LEXUS TRANS 1.5L', 'yuliana-cilindro-lexus-trans-15l', 'YULIANA CILINDRO LEXUS TRANS 1.5L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 86.40, 10, 3, '7500864009124', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA CORTINA DE BAÑO DOLAR', 'yuliana-cortina-de-bano-dolar', 'YULIANA CORTINA DE BAÑO DOLAR disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cortinas de Baño', 32.00, 10, 3, '7500864010156', 'Yuliana', 'new', 0, 37, 0, 1),
('YULIANA CORTINA GRUESA DE BAÑO', 'yuliana-cortina-gruesa-de-bano', 'YULIANA CORTINA GRUESA DE BAÑO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cortinas de Baño', 128.00, 10, 3, '7503021562685', 'Yuliana', 'new', 0, 37, 0, 1),
('YULIANA TOPER CON 3 DIVISIONES', 'yuliana-toper-con-3-divisiones-7503023222099', 'YULIANA TOPER CON 3 DIVISIONES disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Organizadores y Topers', 83.20, 10, 3, '7503023222099', 'Yuliana', 'new', 0, 36, 0, 1),
('YULIANA SOPORTE SHOWER', 'yuliana-soporte-shower-7503024487824', 'YULIANA SOPORTE SHOWER disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Accesorios de Baño', 158.40, 10, 3, '7503024487824', 'Yuliana', 'new', 0, 40, 0, 1),
('YULIANA CILINDRO LEXUS 600ML', 'yuliana-cilindro-lexus-600ml', 'YULIANA CILINDRO LEXUS 600ML disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 48.00, 10, 3, '7503028551613', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA CILINDRO VENUS 2.2L', 'yuliana-cilindro-venus-22l', 'YULIANA CILINDRO VENUS 2.2L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 49.60, 10, 3, '7503028865550', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA CILINDRO VENUS 1L', 'yuliana-cilindro-venus-1l', 'YULIANA CILINDRO VENUS 1L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 36.80, 10, 3, '7503030964012', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA CORTINA DELGADA PARA BAÑO', 'yuliana-cortina-delgada-para-bano', 'YULIANA CORTINA DELGADA PARA BAÑO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cortinas de Baño', 92.80, 10, 3, '7503030964173', 'Yuliana', 'new', 0, 37, 0, 1),
('YULIANA BANCO RATTAN', 'yuliana-banco-rattan', 'YULIANA BANCO RATTAN disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Muebles de Baño', 97.60, 10, 3, '7503030964432', 'Yuliana', 'new', 0, 39, 0, 1),
('YULIANA BANCO TIVURON PLATA', 'yuliana-banco-tivuron-plata', 'YULIANA BANCO TIVURON PLATA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Muebles de Baño', 86.40, 10, 3, '7503030964449', 'Yuliana', 'new', 0, 39, 0, 1),
('YULIANA CILINDRO VENUS POLIPRO 2.2L', 'yuliana-cilindro-venus-polipro-22l', 'YULIANA CILINDRO VENUS POLIPRO 2.2L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 49.60, 10, 3, '7503030964517', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA CILINDRO VENUS POLIPRO 1.1L', 'yuliana-cilindro-venus-polipro-11l', 'YULIANA CILINDRO VENUS POLIPRO 1.1L disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cilindros y Botellas', 36.80, 10, 3, '7503030964524', 'Yuliana', 'new', 0, 38, 0, 1),
('YULIANA BACO MERCEDES', 'yuliana-baco-mercedes', 'YULIANA BACO MERCEDES disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Muebles de Baño', 147.20, 10, 3, '7503030964784', 'Yuliana', 'new', 0, 39, 0, 1),
('OURO SEDA UVA 150ML', 'ouro-seda-uva-150ml', 'OURO SEDA UVA 150ML disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 140.25, 10, 3, '7503326094255', 'Ouro', 'new', 0, 44, 0, 1),
('BANDERIN CHICO', 'banderin-chico', 'BANDERIN CHICO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Globos y Decoración', 20.02, 10, 3, '10244', NULL, 'new', 0, 32, 0, 1),
('SET DE GLOBOS 5 PIEZAS PERSONAJES', 'set-de-globos-5-piezas-personajes', 'SET DE GLOBOS 5 PIEZAS PERSONAJES disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Globos y Decoración', 20.82, 10, 3, '10423', NULL, 'new', 0, 32, 0, 1),
('NUTRAPEL MASCARILLA CAPILAR CURLY 360G', 'nutrapel-mascarilla-capilar-curly-360g', 'NUTRAPEL MASCARILLA CAPILAR CURLY 360G disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 28.80, 10, 3, '7501502326153', 'Nutrapel', 'new', 0, 44, 0, 1),
('SKALA BRASIL ABACATE TRATAMIENTO ACONDICIONADOR 1KG', 'skala-brasil-abacate-tratamiento-acondicionador-1kg', 'SKALA BRASIL ABACATE TRATAMIENTO ACONDICIONADOR 1KG disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 95.00, 10, 3, '7897041872141', 'Skala', 'new', 0, 44, 1, 1),
('OURO PROTECTOR DE CALOR/ARGAN 125ML', 'ouro-protector-de-calorargan-125ml', 'OURO PROTECTOR DE CALOR/ARGAN 125ML disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 196.00, 10, 3, '7502279000807', 'Ouro', 'new', 0, 44, 0, 1),
('BARBIUX ACEITE DE MACADAMIA 60ML', 'barbiux-aceite-de-macadamia-60ml', 'BARBIUX ACEITE DE MACADAMIA 60ML disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 149.80, 10, 3, '7502279000808', 'Barbiux', 'new', 0, 44, 0, 1),
('RIZADO DE PESTAÑAS 3DENIS', 'rizado-de-pestanas-3denis', 'RIZADO DE PESTAÑAS 3DENIS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Accesorios de Belleza', 127.40, 10, 3, '7502267390007', NULL, 'new', 0, 46, 0, 1),
('BISSU MAQUILLAJE COMPACTO 01 TRANSLUCID', 'bissu-maquillaje-compacto-01-translucid', 'BISSU MAQUILLAJE COMPACTO 01 TRANSLUCID disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Maquillaje', 196.70, 10, 3, '7503040008003', 'Bissu', 'new', 0, 42, 1, 1),
('PRIMER PARA ROSTRO BISSU', 'primer-para-rostro-bissu', 'PRIMER PARA ROSTRO BISSU disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Maquillaje', 100.80, 10, 3, '320005', NULL, 'new', 0, 42, 0, 1),
('TOALLAS SCOTT SHOP', 'toallas-scott-shop', 'TOALLAS SCOTT SHOP disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Limpieza', 147.00, 10, 3, '054000751301', 'Scott', 'new', 0, 49, 0, 1),
('CORTINA DE LLUVIA CUADRADA VARIOS COLORES', 'cortina-de-lluvia-cuadrada-varios-colores', 'CORTINA DE LLUVIA CUADRADA VARIOS COLORES disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Globos y Decoración', 68.60, 10, 3, '10856', NULL, 'new', 0, 32, 0, 1),
('DUMPLING LISO', 'dumpling-liso', 'DUMPLING LISO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 18.27, 10, 3, '12143', NULL, 'new', 0, 56, 0, 1),
('CEPILLO PLASTICO GUITARRA CERDAS DURAS', 'cepillo-plastico-guitarra-cerdas-duras', 'CEPILLO PLASTICO GUITARRA CERDAS DURAS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 32.40, 10, 3, '10585', NULL, 'new', 0, 44, 0, 1),
('ALBY ACEITE GLICERINA NATURAL', 'alby-aceite-glicerina-natural', 'ALBY ACEITE GLICERINA NATURAL disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cuidado Personal', 23.80, 10, 3, '7503010569756', NULL, 'new', 0, 45, 0, 1),
('BY APPLE SACAPUNTAS DOBLE', 'by-apple-sacapuntas-doble', 'BY APPLE SACAPUNTAS DOBLE disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Escolares', 23.49, 10, 3, '10404', 'By Apple', 'new', 0, 29, 0, 1),
('PINZA PARA ROPA 100PCS', 'pinza-para-ropa-100pcs', 'PINZA PARA ROPA 100PCS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Limpieza', 7.00, 10, 3, '10250', NULL, 'new', 0, 49, 0, 1),
('LOMAREY PISTOLA DE SILICON', 'lomarey-pistola-de-silicon', 'LOMAREY PISTOLA DE SILICON disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Papel y Manualidades', 38.55, 10, 3, '5631897125481', 'Lomarey', 'new', 0, 30, 0, 1),
('CARTERA DOBLE/TRIPLE', 'cartera-dobletriple', 'CARTERA DOBLE/TRIPLE disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Bolsos y Carteras', 45.03, 10, 3, '13486', NULL, 'new', 0, 60, 0, 1),
('PAPEL COREANO UN SOLO MODELO/PQ', 'papel-coreano-un-solo-modelopq', 'PAPEL COREANO UN SOLO MODELO/PQ disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Bolsas y Papel de Regalo', 59.50, 10, 3, '11905', NULL, 'new', 0, 33, 0, 1),
('DONA DE TERCIOPELO/BRILLOSA', 'dona-de-terciopelobrillosa', 'DONA DE TERCIOPELO/BRILLOSA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Accesorios de Cabello', 47.25, 10, 3, '7506601400148', NULL, 'new', 0, 62, 0, 1),
('NITRAM COTONETE BOITE 400PZ', 'nitram-cotonete-boite-400pz', 'NITRAM COTONETE BOITE 400PZ disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cuidado Personal', 32.00, 10, 3, '7506601400149', 'Nitram', 'new', 0, 45, 0, 1),
('BISSU ESMALTE MINI A GRANEL', 'bissu-esmalte-mini-a-granel', 'BISSU ESMALTE MINI A GRANEL disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Uñas', 19.20, 10, 3, '13259', 'Bissu', 'new', 0, 43, 0, 1),
('BISSU ESMALTE GRANDE A GRANEL', 'bissu-esmalte-grande-a-granel', 'BISSU ESMALTE GRANDE A GRANEL disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Uñas', 35.20, 10, 3, '13260', 'Bissu', 'new', 0, 43, 0, 1),
('TIN ECONOMICO', 'tin-economico', 'TIN ECONOMICO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Calcetines y Medias', 5.04, 10, 3, '10830', NULL, 'new', 0, 63, 0, 1),
('TIN COTT-LINE VARIOS', 'tin-cott-line-varios', 'TIN COTT-LINE VARIOS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Calcetines y Medias', 10.15, 10, 3, '12100', 'Cott-Line', 'new', 0, 63, 0, 1),
('DEDO DE PLASTICO', 'dedo-de-plastico', 'DEDO DE PLASTICO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Uñas', 5.00, 10, 3, '10534', NULL, 'new', 0, 43, 0, 1),
('BY APPLE CORTA UÑAS DE BEBE Y CADENA', 'by-apple-corta-unas-de-bebe-y-cadena', 'BY APPLE CORTA UÑAS DE BEBE Y CADENA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Bebés', 11.05, 10, 3, '10406', 'By Apple', 'new', 0, 57, 0, 1),
('PLASTILINA PLAY-DOH', 'plastilina-play-doh', 'PLASTILINA PLAY-DOH disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 30.00, 10, 3, '630509449651', 'Play-Doh', 'new', 0, 56, 0, 1),
('BARAJA PLASTIFICADA CAJA NEGRA', 'baraja-plastificada-caja-negra', 'BARAJA PLASTIFICADA CAJA NEGRA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 24.30, 10, 3, '11097', NULL, 'new', 0, 56, 0, 1),
('LAPICERO FINO C/6PZ VARIOS', 'lapicero-fino-c6pz-varios', 'LAPICERO FINO C/6PZ VARIOS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Escritura y Colores', 30.00, 10, 3, '12093', NULL, 'new', 0, 28, 0, 1),
('PINK UP ESMALTE A GRANEL', 'pink-up-esmalte-a-granel', 'PINK UP ESMALTE A GRANEL disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Uñas', 43.20, 10, 3, '10702', 'Pink Up', 'new', 0, 43, 0, 1),
('NUTRAPEL AMPOLLETAS VARIOS NUTRAPEL', 'nutrapel-ampolletas-varios-nutrapel', 'NUTRAPEL AMPOLLETAS VARIOS NUTRAPEL disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 19.20, 10, 3, '10906', 'Nutrapel', 'new', 0, 44, 0, 1),
('CALCULADORA MEGATRONIC MG-8985A', 'calculadora-megatronic-mg-8985a', 'CALCULADORA MEGATRONIC MG-8985A disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Escolares', 52.80, 10, 3, '6925625456046', NULL, 'new', 0, 29, 0, 1),
('STIKER VARIOS CARICATURA', 'stiker-varios-caricatura', 'STIKER VARIOS CARICATURA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Escolares', 4.40, 10, 3, '11120', NULL, 'new', 0, 29, 0, 1),
('BISSU LABIAL MATE 22 VENECIA', 'bissu-labial-mate-22-venecia', 'BISSU LABIAL MATE 22 VENECIA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Maquillaje', 46.40, 10, 3, '7503041351979', 'Bissu', 'new', 0, 42, 0, 1),
('CUATRO POLVO ACRILICO #16', 'cuatro-polvo-acrilico-16', 'CUATRO POLVO ACRILICO #16 disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Uñas', 23.00, 10, 3, '7502283479243', NULL, 'new', 0, 43, 0, 1),
('TIP P/UÑA SEMICUADRADO', 'tip-puna-semicuadrado', 'TIP P/UÑA SEMICUADRADO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Uñas', 22.00, 10, 3, '6975464590838', NULL, 'new', 0, 43, 0, 1),
('MC PEGAMENTO PARA UÑAS GOTERO', 'mc-pegamento-para-unas-gotero', 'MC PEGAMENTO PARA UÑAS GOTERO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Uñas', 20.00, 10, 3, '7502285962361', 'MC', 'new', 0, 43, 0, 1),
('TOALLA NEGRA SCHWARZKOPF PROFECIONAL', 'toalla-negra-schwarzkopf-profecional', 'TOALLA NEGRA SCHWARZKOPF PROFECIONAL disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 50.40, 10, 3, '11287', 'Schwarzkopf', 'new', 0, 44, 0, 1),
('HIDRA CUBRIDOR LARGO NEGRO SCHWARZKOPF E', 'hidra-cubridor-largo-negro-schwarzkopf-e', 'HIDRA CUBRIDOR LARGO NEGRO SCHWARZKOPF E disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Accesorios de Belleza', 80.00, 10, 3, '11290', 'Schwarzkopf', 'new', 0, 46, 0, 1),
('RIZADO DE PESTAÑAS PERMANENTE BELLET', 'rizado-de-pestanas-permanente-bellet', 'RIZADO DE PESTAÑAS PERMANENTE BELLET disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Accesorios de Belleza', 100.00, 10, 3, '000006', NULL, 'new', 0, 46, 0, 1),
('TRENZA GRANDE/MEDIANA', 'trenza-grandemediana', 'TRENZA GRANDE/MEDIANA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Accesorios de Cabello', 28.80, 10, 3, '10650', NULL, 'new', 0, 62, 0, 1),
('PINK UP MAQUILLAJE EASY COVER 700', 'pink-up-maquillaje-easy-cover-700', 'PINK UP MAQUILLAJE EASY COVER 700 disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Maquillaje', 156.80, 10, 3, '7502295831305', 'Pink Up', 'new', 0, 42, 0, 1),
('AURIFONOS MANOS LIBRES SIN GOMA', 'aurifonos-manos-libres-sin-goma', 'AURIFONOS MANOS LIBRES SIN GOMA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Tecnología y Audio', 19.00, 10, 3, '12608', NULL, 'new', 0, 58, 0, 1),
('LICUADORA OSTER 10 VELOCIDADES/6662', 'licuadora-oster-10-velocidades6662', 'LICUADORA OSTER 10 VELOCIDADES/6662 disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Electrodomésticos', 680.00, 10, 3, '034264042520', 'Oster', 'new', 0, 50, 1, 1),
('SOMBRILLA DE BOLSILLO S-53', 'sombrilla-de-bolsillo-s-53', 'SOMBRILLA DE BOLSILLO S-53 disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Sombrillas', 95.00, 10, 3, '10033', NULL, 'new', 0, 64, 0, 1),
('BOCINA BLUETOOTH VA479TL', 'bocina-bluetooth-va479tl', 'BOCINA BLUETOOTH VA479TL disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Tecnología y Audio', 130.00, 10, 3, '04895174141989', NULL, 'new', 0, 58, 0, 1),
('ALFAPAEF #11.02', 'alfapaef-1102', 'ALFAPAEF #11.02 disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 134.94, 10, 3, '8022297167251', 'Alfaparf', 'new', 0, 44, 1, 1),
('CILINDRO PARA AGUA 3 PIEZAS CAPIBARA VARIOS COLORES', 'cilindro-para-agua-3-piezas-capibara-varios-colores', 'CILINDRO PARA AGUA 3 PIEZAS CAPIBARA VARIOS COLORES disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Organización', 65.60, 10, 3, '888881693085', NULL, 'new', 0, 52, 1, 1),
('KUUL COLOR ME SHAMPOO 300ML', 'kuul-color-me-shampoo-300ml', 'KUUL COLOR ME SHAMPOO 300ML disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 420.00, 10, 3, '7501438363130', 'Kuul', 'new', 0, 44, 0, 1),
('MUÑECA CUTE GIRL', 'muneca-cute-girl', 'MUÑECA CUTE GIRL disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 420.00, 10, 3, 'C12023017566799', NULL, 'new', 0, 56, 0, 1),
('ALTIVA ALCANCIA DE METAL VARIOS', 'altiva-alcancia-de-metal-varios', 'ALTIVA ALCANCIA DE METAL VARIOS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Decoración', 31.50, 10, 3, '12704', 'Altiva', 'new', 0, 53, 0, 1),
('CHANCLA SPORT VARIOS', 'chancla-sport-varios', 'CHANCLA SPORT VARIOS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cinturones y Calzado', 35.70, 10, 3, '10247', NULL, 'new', 0, 61, 0, 1),
('LOTERIA/SERPIENTES Y ESCALETAS CAMPI', 'loteriaserpientes-y-escaletas-campi', 'LOTERIA/SERPIENTES Y ESCALETAS CAMPI disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 28.80, 10, 3, '12221', NULL, 'new', 0, 56, 0, 1),
('PLUMON DELINEADOR PARA OJOS', 'plumon-delineador-para-ojos', 'PLUMON DELINEADOR PARA OJOS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Maquillaje', 30.00, 10, 3, '7501611833498', NULL, 'new', 0, 42, 0, 1),
('ESTRELLA LIBRETA PROFECIONAL 5MM', 'estrella-libreta-profecional-5mm', 'ESTRELLA LIBRETA PROFECIONAL 5MM disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Libretas y Cuadernos', 17.40, 10, 3, '602760004597', 'Estrella', 'new', 0, 27, 0, 1),
('CINTURON CAJA/AGUJA', 'cinturon-cajaaguja', 'CINTURON CAJA/AGUJA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cinturones y Calzado', 49.92, 10, 3, '10376', NULL, 'new', 0, 61, 0, 1),
('JUEGO DE JARRA ANCHOR', 'juego-de-jarra-anchor', 'JUEGO DE JARRA ANCHOR disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cocina', 230.00, 10, 3, '076440832846', 'Anchor', 'new', 0, 48, 0, 1),
('KIT DE DESARMADOR CON 12 PZ', 'kit-de-desarmador-con-12-pz', 'KIT DE DESARMADOR CON 12 PZ disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Herramientas', 36.00, 10, 3, '7908782200508', NULL, 'new', 0, 51, 0, 1),
('PLANTILLA BLANCA P/10PZ', 'plantilla-blanca-p10pz', 'PLANTILLA BLANCA P/10PZ disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cinturones y Calzado', 49.00, 10, 3, '10630', NULL, 'new', 0, 61, 0, 1),
('CABALLO DE PALO', 'caballo-de-palo', 'CABALLO DE PALO disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 105.00, 10, 3, '11134', NULL, 'new', 0, 56, 0, 1),
('ESTROPAJO DUTCHIBA', 'estropajo-dutchiba', 'ESTROPAJO DUTCHIBA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Limpieza', 12.45, 10, 3, '7501009231165', NULL, 'new', 0, 49, 0, 1),
('BOLSA DE REGALO 14 DE FEBRERO/GRANDE', 'bolsa-de-regalo-14-de-febrerogrande', 'BOLSA DE REGALO 14 DE FEBRERO/GRANDE disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Bolsas y Papel de Regalo', 18.00, 10, 3, '13403', NULL, 'new', 0, 33, 0, 1),
('VENTILADOR DAEWO/45 WATTS', 'ventilador-daewo45-watts', 'VENTILADOR DAEWO/45 WATTS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Electrodomésticos', 700.00, 10, 3, '4895155648148', 'Daewo', 'new', 0, 50, 0, 1),
('PATINETIA DE 4 RUEDAS/AVENGERS', 'patinetia-de-4-ruedasavengers', 'PATINETIA DE 4 RUEDAS/AVENGERS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 350.00, 10, 3, '4891861205064', NULL, 'new', 0, 56, 0, 1),
('CARREOLA PARA MUÑECA MY-5530', 'carreola-para-muneca-my-5530', 'CARREOLA PARA MUÑECA MY-5530 disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 415.00, 10, 3, '13085', NULL, 'new', 0, 56, 0, 1),
('KEHEL UÑA MARAVILLA TOP COAT', 'kehel-una-maravilla-top-coat', 'KEHEL UÑA MARAVILLA TOP COAT disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Uñas', 140.00, 10, 3, '7506289918065', 'Kehel', 'new', 0, 43, 0, 1),
('DINO SAUR SPRAY DIY M8018-70', 'dino-saur-spray-diy-m8018-70', 'DINO SAUR SPRAY DIY M8018-70 disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 78.30, 10, 3, '12684', NULL, 'new', 0, 56, 0, 1),
('KUUL TRATAMIENTO CURE RECONSTRUCTOR 245G', 'kuul-tratamiento-cure-reconstructor-245g', 'KUUL TRATAMIENTO CURE RECONSTRUCTOR 245G disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 94.90, 10, 3, '7501438366483', 'Kuul', 'new', 0, 44, 0, 1),
('KUUL CERA P/CABELLO MORADA', 'kuul-cera-pcabello-morada', 'KUUL CERA P/CABELLO MORADA disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Cabello', 28.48, 10, 3, '7501438363321', 'Kuul', 'new', 0, 44, 0, 1),
('PRIS ACETONA PURA 125ML', 'pris-acetona-pura-125ml', 'PRIS ACETONA PURA 125ML disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Uñas', 44.98, 10, 3, '7502252850486', 'Pris', 'new', 0, 43, 0, 1),
('CARRITO HOT WHEELS/CAJA CON 72PZ', 'carrito-hot-wheelscaja-con-72pz', 'CARRITO HOT WHEELS/CAJA CON 72PZ disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Juguetes', 70.00, 10, 3, '027084120134', 'Hot Wheels', 'new', 0, 56, 0, 1),
('PELUCHE ECO/CARICATURAS VARIOS', 'peluche-ecocaricaturas-varios', 'PELUCHE ECO/CARICATURAS VARIOS disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.', 'Producto nuevo de Peluches', 156.80, 10, 3, '13166', NULL, 'new', 0, 55, 0, 1);

-- Insert sample coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, end_date, is_active) VALUES
('BIENVENIDO10', '10% de descuento en tu primera compra', 'percentage', 10, 120, 600, 100, DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE),
('ENVIOGRATIS', 'Envío gratis en compras mayores a $600 MXN', 'fixed', 0, 600, 0, 500, DATE_ADD(NOW(), INTERVAL 60 DAY), TRUE),
('BLACKFRIDAY20', '20% off en productos seleccionados', 'percentage', 20, 240, 1200, 200, DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE),
('ADMIN50', 'Descuento especial admin 50%', 'percentage', 50, 0, 6000, 10, DATE_ADD(NOW(), INTERVAL 365 DAY), TRUE);

-- Los productos inician sin reseñas; las calificaciones se actualizan con las opiniones de clientes.

-- Create views for common queries
CREATE OR REPLACE VIEW view_products_with_details AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.short_description,
    p.price,
    p.original_price,
    p.stock_quantity,
    p.sku,
    p.brand,
    p.condition_type,
    p.shipping_free,
    p.shipping_cost,
    p.rating_average,
    p.rating_count,
    p.sold_count,
    p.is_active,
    p.is_featured,
    p.category_id,
    c.name as category_name,
    c.slug as category_slug,
    pi.image_url as primary_image
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
WHERE p.is_active = TRUE AND c.is_active = TRUE;

CREATE OR REPLACE VIEW view_orders_summary AS
SELECT 
    o.id,
    o.order_number,
    o.user_id,
    u.email as user_email,
    CONCAT(u.first_name, ' ', u.last_name) as user_name,
    o.status,
    o.total_amount,
    o.payment_status,
    o.created_at,
    COUNT(oi.id) as items_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;

-- Stored procedure for product search
DELIMITER //
CREATE PROCEDURE sp_search_products(
    IN p_search_term VARCHAR(255),
    IN p_category_id INT,
    IN p_min_price DECIMAL(10,2),
    IN p_max_price DECIMAL(10,2),
    IN p_brand VARCHAR(100),
    IN p_condition_type VARCHAR(20),
    IN p_sort_by VARCHAR(50),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        p.id, p.name, p.slug, p.short_description, p.price, p.original_price,
        p.stock_quantity, p.brand, p.rating_average, p.rating_count,
        p.sold_count, p.shipping_free, p.is_featured,
        c.name as category_name, c.slug as category_slug,
        pi.image_url as primary_image,
        MATCH(p.name, p.description, p.short_description) AGAINST(p_search_term IN NATURAL LANGUAGE MODE) as relevance
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
    WHERE p.is_active = TRUE
    AND (p_search_term = '' OR MATCH(p.name, p.description, p.short_description) AGAINST(p_search_term IN NATURAL LANGUAGE MODE))
    AND (p_category_id IS NULL OR p.category_id = p_category_id OR c.parent_id = p_category_id)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_brand IS NULL OR p.brand = p_brand)
    AND (p_condition_type IS NULL OR p.condition_type = p_condition_type)
    ORDER BY 
        CASE WHEN p_sort_by = 'price_asc' THEN p.price END ASC,
        CASE WHEN p_sort_by = 'price_desc' THEN p.price END DESC,
        CASE WHEN p_sort_by = 'rating' THEN p.rating_average END DESC,
        CASE WHEN p_sort_by = 'newest' THEN p.created_at END DESC,
        CASE WHEN p_sort_by = 'best_selling' THEN p.sold_count END DESC,
        CASE WHEN p_sort_by = 'relevance' THEN relevance END DESC,
        p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END //
DELIMITER ;

-- Trigger to update product rating when review is inserted/updated
DELIMITER //
CREATE TRIGGER tr_update_product_rating_after_review
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE products 
    SET rating_average = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = NEW.product_id AND is_approved = TRUE),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id AND is_approved = TRUE)
    WHERE id = NEW.product_id;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER tr_update_product_rating_after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    UPDATE products 
    SET rating_average = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = NEW.product_id AND is_approved = TRUE),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id AND is_approved = TRUE)
    WHERE id = NEW.product_id;

    IF OLD.product_id <> NEW.product_id THEN
        UPDATE products 
        SET rating_average = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = OLD.product_id AND is_approved = TRUE),
            rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = OLD.product_id AND is_approved = TRUE)
        WHERE id = OLD.product_id;
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER tr_update_product_rating_after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    UPDATE products 
    SET rating_average = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = OLD.product_id AND is_approved = TRUE),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = OLD.product_id AND is_approved = TRUE)
    WHERE id = OLD.product_id;
END //
DELIMITER ;

-- Trigger to update stock when order is placed
DELIMITER //
CREATE TRIGGER tr_update_stock_after_order
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity,
        sold_count = sold_count + NEW.quantity
    WHERE id = NEW.product_id;
END //
DELIMITER ;

-- Grant permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON chuchicharas_db.* TO 'chuchicharas_user'@'localhost' IDENTIFIED BY 'secure_password';
-- FLUSH PRIVILEGES;