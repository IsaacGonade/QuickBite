DROP DATABASE IF EXISTS tfgRestaurante;
CREATE DATABASE tfgRestaurante;
USE tfgRestaurante;

-- 1. Tabla de Categorías
CREATE TABLE Categorias (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- 2. Tabla de Platos
CREATE TABLE Platos (
    id_plato INT PRIMARY KEY AUTO_INCREMENT,
    id_categoria INT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    disponible BOOLEAN DEFAULT TRUE,
    url_imagen VARCHAR(255),
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria)
);

CREATE TABLE Mesas (
    id_mesa INT PRIMARY KEY AUTO_INCREMENT,
    numero_mesa INT UNIQUE NOT NULL, -- Ej: Mesa 1, Mesa 2...
    capacidad INT NOT NULL,          -- Ej: 2, 4, 6 personas
    ubicacion VARCHAR(50),           -- Ej: 'Terraza', 'Salón Principal', 'Ventana'
    estado_servicio ENUM('Activa', 'Mantenimiento') DEFAULT 'Activa'
);

-- 3. Tabla de Reservas
CREATE TABLE Reservas (
    id_reserva INT PRIMARY KEY AUTO_INCREMENT,
    id_mesa INT, -- <--- Relación con la tabla Mesas
    nombre_cliente VARCHAR(100) NOT NULL,
    email_cliente VARCHAR(100) NOT NULL,
    fecha_reserva DATETIME NOT NULL,
    num_comensales INT NOT NULL,
    estado ENUM('Pendiente', 'Confirmada', 'Cancelada') DEFAULT 'Pendiente',
    FOREIGN KEY (id_mesa) REFERENCES Mesas(id_mesa)
);

ALTER TABLE Reservas ADD COLUMN id_usuario INT NULL;

-- 4. Tabla de Usuarios
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Siempre guarda hashes, nunca contraseñas en texto plano
    rol ENUM('admin', 'normal') DEFAULT 'normal',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- 1. Tabla de Eventos
CREATE TABLE Eventos (
    id_evento INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    url_imagen VARCHAR(255) -- Opcional, por si quieres ponerle un cartel
);


-- 2. Tabla de Ofertas/Descuentos
CREATE TABLE Ofertas (
    id_oferta INT PRIMARY KEY AUTO_INCREMENT,
    nombre_oferta VARCHAR(100),
    porcentaje_descuento INT NOT NULL, -- Ej: 15 para un 15%
    id_categoria INT DEFAULT NULL,    -- Si es para una categoría completa
    id_plato INT DEFAULT NULL,        -- Si es para un plato específico
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria) ON DELETE CASCADE,
    FOREIGN KEY (id_plato) REFERENCES Platos(id_plato) ON DELETE CASCADE
);





INSERT INTO Categorias (nombre, descripcion) VALUES 
('Entrantes', 'Para abrir el apetito'),
('Hamburguesas', 'Nuestra especialidad con carne de primera'),
('Pastas', 'Recetas italianas tradicionales'),
('Bebidas', 'Refrescos, vinos y cervezas artesanas'),
('Postres', 'El toque dulce para terminar');



INSERT INTO Mesas (numero_mesa, capacidad, ubicacion) VALUES 
(1, 2, 'Ventana'),
(2, 2, 'Ventana'),
(3, 4, 'Salón Principal'),
(4, 4, 'Salón Principal'),
(5, 6, 'Zona VIP'),
(6, 2, 'Terraza'),
(7, 4, 'Terraza'),
(8, 8, 'Salón Principal');



INSERT INTO Platos (id_categoria, nombre, descripcion, precio, url_imagen) VALUES 
(1, 'Gyozas al Vapor', '6 piezas con salsa soja y jengibre', 7.50, 'https://hitsnoodles.com/wp-content/uploads/2024/12/receta-gyoza-de-pollo-1024x434.webp'),
(2, 'Angular Burger', 'Ternera 200g, cheddar, cebolla caramelizada', 14.50, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
(3, 'Pasta TypeScript', 'Carbonara auténtica con guanciale y huevo', 13.00, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400'),
(5, 'Coulant de Chocolate', 'Corazón líquido con helado de vainilla', 6.50, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400'),
(4, 'Cerveza Artesanal IPA', 'Cerveza local de barril muy fría (Pinta)', 3.50, 'https://www.brebel.beer/wp-content/uploads/2021/11/comprar-cerveza-artesana-IPA-sin-alcohol-sin-gluten-brebel.jpg'),
(4, 'Refresco de Cola', 'Lata de 33cl con hielo y limón', 2.50, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400');

INSERT INTO Reservas (id_mesa, nombre_cliente, email_cliente, fecha_reserva, num_comensales, estado) VALUES 
(1, 'Juan Prueba', 'juan@ejemplo.com', '2026-04-06 21:00:00', 2, 'Confirmada');


-- 1. Oferta para un plato específico (Ej: 20% de descuento en las Gyozas, asumiendo que su id_plato es 1)
INSERT INTO Ofertas (nombre_oferta, porcentaje_descuento, id_categoria, id_plato, activa) 
VALUES ('Promo Gyozas', 20, NULL, 1, 1);
-- 2. Oferta para una categoría entera (Ej: 15% de descuento en todas las Hamburguesas, asumiendo que su id_categoria es 2)
INSERT INTO Ofertas (nombre_oferta, porcentaje_descuento, id_categoria, id_plato, activa) 
VALUES ('Días de Burger', 15, 2, NULL, 1);


INSERT INTO Eventos (titulo, descripcion, fecha_inicio, fecha_fin, url_imagen) VALUES 
('Noche de Música en Vivo', 'Disfruta de la mejor música de los 80 y 90 con nuestro grupo invitado, mientras pruebas nuestra nueva carta de cócteles.', '2026-05-15 21:00:00', '2026-05-15 23:59:00', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600'),
('Cata de Cervezas Artesanales', 'Descubre 5 tipos de cervezas locales maridadas con nuestros entrantes estrella. ¡Plazas limitadas!', '2026-05-22 19:30:00', '2026-05-22 21:30:00', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600');

