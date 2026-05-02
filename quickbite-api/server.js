const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors()); // Permite que Angular se conecte
app.use(express.json());

//Conexión a la Base de Datos
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "toor",
  database: "tfgrestaurante",
});

db.connect((err) => {
  if (err) console.error("Error conectando a MySQL:", err);
  else console.log("¡Conectado a MySQL!");
});

//Ruta para obtener las mesas y su estado
app.get("/api/mesas", (req, res) => {
  const { fecha } = req.query;
  //Formateo las fechas para que coincidan seguro
  const query = `
    SELECT m.id_mesa, m.numero_mesa, m.capacidad, m.ubicacion,
    MAX(CASE WHEN r.id_reserva IS NOT NULL THEN 1 ELSE 0 END) AS ocupada
    FROM Mesas m
    LEFT JOIN Reservas r ON m.id_mesa = r.id_mesa 
      AND DATE_FORMAT(r.fecha_reserva, '%Y-%m-%d %H:%i') = DATE_FORMAT(?, '%Y-%m-%d %H:%i')
      AND r.estado != 'Cancelada'
    GROUP BY m.id_mesa, m.numero_mesa, m.capacidad, m.ubicacion
  `;

  db.query(query, [fecha], (err, results) => {
    if (err) {
      console.error("Error SQL:", err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});

const bcrypt = require("bcryptjs");

//Ruta para el registro
app.post("/api/registro", async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    //encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    //insertar en BBDD
    const query = `INSERT INTO Usuarios (nombre_usuario, email, password_hash, rol) VALUES (?, ?, ?, 'normal')`;

    db.query(query, [nombre, email, passwordHash], (err, results) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ error: "El email ya está registrado" });
        return res.status(500).json({ error: "Error en la base de datos" });
      }
      res.json({ mensaje: "Usuario registrado con éxito" });
    });
  } catch (error) {
    res.status(500).json({ error: "Error al procesar el registro" });
  }
});

//Ruta para el login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  //Buscar al usuario por email
  const query = `SELECT * FROM Usuarios WHERE email = ?`;

  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Error en el servidor" });
    if (results.length === 0)
      return res.status(401).json({ error: "Usuario no encontrado" });

    const usuario = results[0];

    //Comparar la contraseña introducida con la encriptada
    const passwordValida = await bcrypt.compare(
      password,
      usuario.password_hash,
    );
    if (!passwordValida)
      return res.status(401).json({ error: "Contraseña incorrecta" });

    //Si todo es correcto
    res.json({
      id: usuario.id_usuario,
      nombre: usuario.nombre_usuario,
      email: usuario.email,
      rol: usuario.rol,
    });
  });
});

//Ruta para crear la reserva
// Crear una nueva reserva
app.post("/api/reservas", (req, res) => {
  // Añadimos id_usuario a lo que extraemos del body
  const {
    nombre_cliente,
    email_cliente,
    fecha_reserva,
    num_comensales,
    id_mesa,
    id_usuario,
  } = req.body;

  // Si no viene id_usuario (invitado), le asignamos null
  const usuario_id = id_usuario || null;

  // Añadimos id_usuario a la consulta SQL
  const query = `
        INSERT INTO Reservas 
        (nombre_cliente, email_cliente, fecha_reserva, num_comensales, id_mesa, estado, id_usuario) 
        VALUES (?, ?, ?, ?, ?, 'Pendiente', ?)
    `;

  db.query(
    query,
    [
      nombre_cliente,
      email_cliente,
      fecha_reserva,
      num_comensales,
      id_mesa,
      usuario_id,
    ],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({
        mensaje: "Reserva creada con éxito",
        id_reserva: result.insertId,
      });
    },
  );
});

//Ruta para ver la carta
app.get("/api/carta", (req, res) => {
  const query = `
    SELECT 
      p.id_plato, 
      p.id_categoria, /* <--- ¡ESTO ES LO QUE FALTABA! */
      p.nombre AS nombre_plato, 
      p.descripcion, 
      p.precio, 
      p.url_imagen,
      c.nombre AS nombre_categoria 
    FROM Platos p 
    JOIN Categorias c ON p.id_categoria = c.id_categoria
    WHERE p.disponible = 1
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error en la consulta de la carta:", err);
      return res
        .status(500)
        .json({ error: "Error al consultar la base de datos" });
    }

    //Agrupar los platos por categoria
    const menuOrganizado = results.reduce((acc, plato) => {
      const cat = plato.nombre_categoria;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(plato);
      return acc;
    }, {});

    res.json(menuOrganizado);
  });
});

// ==========================================
// RUTAS DE ADMINISTRACIÓN (Categorías y Platos)
// ==========================================

// --- CATEGORÍAS ---
app.get("/api/admin/categorias", (req, res) => {
  db.query("SELECT * FROM Categorias", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post("/api/admin/categorias", (req, res) => {
  const { nombre, descripcion } = req.body;
  db.query(
    "INSERT INTO Categorias (nombre, descripcion) VALUES (?, ?)",
    [nombre, descripcion],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, mensaje: "Categoría creada" });
    },
  );
});

app.delete("/api/admin/categorias/:id", (req, res) => {
  db.query(
    "DELETE FROM Categorias WHERE id_categoria = ?",
    [req.params.id],
    (err) => {
      if (err)
        return res.status(500).json({
          error: "No se puede eliminar una categoría con platos asociados",
        });
      res.json({ mensaje: "Categoría eliminada" });
    },
  );
});

// --- PLATOS ---
// Traer todos los platos (sin agrupar) para la tabla del admin
app.get("/api/admin/platos", (req, res) => {
  const query = `
        SELECT p.*, c.nombre AS nombre_categoria 
        FROM Platos p 
        JOIN Categorias c ON p.id_categoria = c.id_categoria
    `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post("/api/admin/platos", (req, res) => {
  const { id_categoria, nombre, descripcion, precio, url_imagen } = req.body;
  const query =
    "INSERT INTO Platos (id_categoria, nombre, descripcion, precio, url_imagen) VALUES (?, ?, ?, ?, ?)";
  db.query(
    query,
    [id_categoria, nombre, descripcion, precio, url_imagen],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, mensaje: "Plato añadido" });
    },
  );
});

app.put("/api/admin/platos/:id", (req, res) => {
  const { id_categoria, nombre, descripcion, precio, url_imagen, disponible } =
    req.body;
  const query =
    "UPDATE Platos SET id_categoria=?, nombre=?, descripcion=?, precio=?, url_imagen=?, disponible=? WHERE id_plato=?";
  db.query(
    query,
    [
      id_categoria,
      nombre,
      descripcion,
      precio,
      url_imagen,
      disponible,
      req.params.id,
    ],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ mensaje: "Plato actualizado" });
    },
  );
});

app.delete("/api/admin/platos/:id", (req, res) => {
  db.query("DELETE FROM Platos WHERE id_plato = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ mensaje: "Plato eliminado" });
  });
});

// Actualizar Categoría
app.put("/api/admin/categorias/:id", (req, res) => {
  const { nombre, descripcion } = req.body;
  db.query(
    "UPDATE Categorias SET nombre=?, descripcion=? WHERE id_categoria=?",
    [nombre, descripcion, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ mensaje: "Categoría actualizada" });
    },
  );
});

// --- RUTAS DE EVENTOS ---
app.get("/api/eventos", (req, res) => {
  const query =
    "SELECT * FROM Eventos WHERE fecha_fin >= NOW() ORDER BY fecha_inicio ASC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// --- RUTA DE OFERTAS ACTIVAS ---
app.get("/api/ofertas", (req, res) => {
  db.query("SELECT * FROM Ofertas WHERE activa = 1", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// --- RUTAS ADMIN PARA EVENTOS Y OFERTAS (CRUD) ---
// ==========================================
// RUTAS DE ADMINISTRACIÓN: EVENTOS
// ==========================================

// Leer todos los eventos (incluso los pasados, para el admin)
app.get("/api/admin/eventos", (req, res) => {
  db.query("SELECT * FROM Eventos", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Crear evento
app.post("/api/admin/eventos", (req, res) => {
  const { titulo, descripcion, fecha_inicio, fecha_fin, url_imagen } = req.body;
  const query =
    "INSERT INTO Eventos (titulo, descripcion, fecha_inicio, fecha_fin, url_imagen) VALUES (?, ?, ?, ?, ?)";
  db.query(
    query,
    [titulo, descripcion, fecha_inicio, fecha_fin, url_imagen],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, mensaje: "Evento creado" });
    },
  );
});

// Actualizar evento
app.put("/api/admin/eventos/:id", (req, res) => {
  const { titulo, descripcion, fecha_inicio, fecha_fin, url_imagen } = req.body;
  const query =
    "UPDATE Eventos SET titulo=?, descripcion=?, fecha_inicio=?, fecha_fin=?, url_imagen=? WHERE id_evento=?";
  db.query(
    query,
    [titulo, descripcion, fecha_inicio, fecha_fin, url_imagen, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ mensaje: "Evento actualizado" });
    },
  );
});

// Eliminar evento
app.delete("/api/admin/eventos/:id", (req, res) => {
  db.query(
    "DELETE FROM Eventos WHERE id_evento = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ mensaje: "Evento eliminado" });
    },
  );
});

// ==========================================
// RUTAS DE ADMINISTRACIÓN: OFERTAS
// ==========================================

// Leer todas las ofertas (con los nombres reales)
app.get("/api/admin/ofertas", (req, res) => {
  const query = `
        SELECT 
            o.*, 
            c.nombre AS nombre_categoria, 
            p.nombre AS nombre_plato
        FROM Ofertas o
        LEFT JOIN Categorias c ON o.id_categoria = c.id_categoria
        LEFT JOIN Platos p ON o.id_plato = p.id_plato
    `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Crear oferta
app.post("/api/admin/ofertas", (req, res) => {
  const {
    nombre_oferta,
    porcentaje_descuento,
    id_categoria,
    id_plato,
    activa,
  } = req.body;

  // Si vienen vacíos, forzamos que sean NULL para la BD
  const cat = id_categoria || null;
  const plato = id_plato || null;

  const query =
    "INSERT INTO Ofertas (nombre_oferta, porcentaje_descuento, id_categoria, id_plato, activa) VALUES (?, ?, ?, ?, ?)";
  db.query(
    query,
    [nombre_oferta, porcentaje_descuento, cat, plato, activa],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, mensaje: "Oferta creada" });
    },
  );
});

// Actualizar oferta
app.put("/api/admin/ofertas/:id", (req, res) => {
  const {
    nombre_oferta,
    porcentaje_descuento,
    id_categoria,
    id_plato,
    activa,
  } = req.body;
  const cat = id_categoria || null;
  const plato = id_plato || null;

  const query =
    "UPDATE Ofertas SET nombre_oferta=?, porcentaje_descuento=?, id_categoria=?, id_plato=?, activa=? WHERE id_oferta=?";
  db.query(
    query,
    [nombre_oferta, porcentaje_descuento, cat, plato, activa, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ mensaje: "Oferta actualizada" });
    },
  );
});

// Eliminar oferta
app.delete("/api/admin/ofertas/:id", (req, res) => {
  db.query(
    "DELETE FROM Ofertas WHERE id_oferta = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ mensaje: "Oferta eliminada" });
    },
  );
});

// 1. OBTENER TODAS LAS MESAS
app.get("/api/admin/mesas", (req, res) => {
  db.query("SELECT * FROM Mesas ORDER BY id_mesa ASC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 2. AÑADIR UNA NUEVA MESA (Actualizado con tu esquema)
app.post("/api/admin/mesas", (req, res) => {
  const { numero_mesa, capacidad, ubicacion, estado_servicio } = req.body;

  // Si no mandan estado, por defecto será 'Activa'
  const estado = estado_servicio || "Activa";

  const query =
    "INSERT INTO Mesas (numero_mesa, capacidad, ubicacion, estado_servicio) VALUES (?, ?, ?, ?)";
  db.query(query, [numero_mesa, capacidad, ubicacion, estado], (err) => {
    if (err) {
      // Si intentan crear una mesa con un número que ya existe (UNIQUE)
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ error: "Ya existe una mesa con ese número." });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ mensaje: "Mesa creada correctamente" });
  });
});

// 4. ACTUALIZAR UNA MESA EXISTENTE
app.put("/api/admin/mesas/:id", (req, res) => {
  const { numero_mesa, capacidad, ubicacion, estado_servicio } = req.body;
  const id_mesa = req.params.id;

  const query =
    "UPDATE Mesas SET numero_mesa = ?, capacidad = ?, ubicacion = ?, estado_servicio = ? WHERE id_mesa = ?";

  db.query(
    query,
    [numero_mesa, capacidad, ubicacion, estado_servicio, id_mesa],
    (err) => {
      if (err) {
        // Controlamos que no le pongan un número de mesa que ya esté usando otra
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ error: "Ya existe otra mesa con ese número." });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ mensaje: "Mesa actualizada correctamente" });
    },
  );
});

// 3. ELIMINAR UNA MESA
app.delete("/api/admin/mesas/:id", (req, res) => {
  db.query("DELETE FROM Mesas WHERE id_mesa = ?", [req.params.id], (err) => {
    if (err) {
      // Error común: intentar borrar una mesa que ya tiene reservas asociadas
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          error:
            "No se puede eliminar la mesa porque tiene reservas asociadas.",
        });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ mensaje: "Mesa eliminada correctamente" });
  });
});

// ==========================================
// RUTAS DE USUARIO (PERFIL)
// ==========================================

// Actualizar datos del usuario (nombre, email, o contraseña)
//const bcrypt = require('bcrypt'); // Asegúrate de tener esta línea arriba

app.put("/api/usuarios/:id", async (req, res) => {
  const id = req.params.id;
  const { nombre, email, password } = req.body;

  try {
    let query;
    let params;

    if (password && password.trim() !== "") {
      // 1. Encriptamos la nueva contraseña antes de guardarla
      // El '10' es el número de rondas de seguridad (salt)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      query =
        "UPDATE Usuarios SET nombre_usuario = ?, email = ?, password_hash = ? WHERE id_usuario = ?";
      params = [nombre, email, hashedPassword, id];
    } else {
      // Si no hay password, solo actualizamos nombre y email
      query =
        "UPDATE Usuarios SET nombre_usuario = ?, email = ? WHERE id_usuario = ?";
      params = [nombre, email, id];
    }

    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: "Perfil actualizado con éxito" });
    });
  } catch (error) {
    res.status(500).json({ error: "Error al procesar la contraseña" });
  }
});

// Eliminar cuenta de usuario
app.delete("/api/usuarios/:id", (req, res) => {
  // Al borrar el usuario, sus reservas también deberían borrarse si tienes "ON DELETE CASCADE" en tu base de datos
  db.query(
    "DELETE FROM usuarios WHERE id_usuario = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ mensaje: "Cuenta eliminada para siempre" });
    },
  );
});

// ==========================================
// RUTAS DE RESERVAS (CLIENTE)
// ==========================================

// Obtener TODAS las reservas de un usuario específico
app.get("/api/reservas/usuario/:id", (req, res) => {
  const query =
    "SELECT r.*, m.capacidad FROM Reservas r JOIN Mesas m ON r.id_mesa = m.id_mesa WHERE r.id_usuario = ?";
  db.query(query, [req.params.id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Actualizar una reserva (Cambiar fecha, hora o comensales)
app.put("/api/reservas/:id", (req, res) => {
  const id_reserva = req.params.id;
  const { num_comensales, fecha_reserva, id_mesa } = req.body;

  // Quitamos la comprobación de 'estado' por si no existe en tu tabla
  const checkQuery =
    "SELECT * FROM Reservas WHERE id_mesa = ? AND fecha_reserva = ? AND id_reserva != ?";

  db.query(checkQuery, [id_mesa, fecha_reserva, id_reserva], (err, results) => {
    if (err) {
      console.error("Error al comprobar mesa:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      return res
        .status(400)
        .json({ error: "La mesa ya está reservada para ese día y hora." });
    }

    const updateQuery =
      "UPDATE Reservas SET num_comensales = ?, fecha_reserva = ? WHERE id_reserva = ?";
    db.query(
      updateQuery,
      [num_comensales, fecha_reserva, id_reserva],
      (updateErr) => {
        if (updateErr) {
          console.error("Error al actualizar:", updateErr);
          return res.status(500).json({ error: updateErr.message });
        }
        res.json({ mensaje: "Reserva actualizada con éxito" });
      },
    );
  });
});

// Cancelar/Eliminar una reserva
app.delete("/api/reservas/:id", (req, res) => {
  db.query(
    "DELETE FROM Reservas WHERE id_reserva = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ mensaje: "Reserva cancelada" });
    },
  );
});

// 1. OBTENER TODAS LAS RESERVAS (Para el panel de Admin)
// Si le pasamos ?fecha=2026-05-09 en la URL, filtrará por ese día
app.get("/api/admin/reservas", (req, res) => {
  // Hemos quitado el JOIN de Usuarios porque ya tienes nombre y email en Reservas
  let query = `
        SELECT r.*, m.capacidad 
        FROM Reservas r
        JOIN Mesas m ON r.id_mesa = m.id_mesa
    `;
  const params = [];

  if (req.query.fecha) {
    query += ` WHERE DATE(r.fecha_reserva) = ?`;
    params.push(req.query.fecha);
  }

  query += ` ORDER BY r.fecha_reserva DESC`;

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 2. CAMBIAR EL ESTADO DE UNA RESERVA (Confirmar / Rechazar)
app.put("/api/admin/reservas/:id/estado", (req, res) => {
  const { estado } = req.body; // Recibirá 'Confirmada', 'Rechazada' o 'Cancelada'
  const id_reserva = req.params.id;

  const query = "UPDATE Reservas SET estado = ? WHERE id_reserva = ?";
  db.query(query, [estado, id_reserva], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: `Reserva ${estado.toLowerCase()} con éxito` });
  });
});

// 1. OBTENER Y BUSCAR USUARIOS
app.get("/api/admin/usuarios", (req, res) => {
  let query = "SELECT id_usuario, nombre_usuario, email, rol FROM Usuarios";
  const params = [];

  // Si el frontend envía un texto de búsqueda (nombre o email)
  if (req.query.busqueda) {
    query += " WHERE nombre_usuario LIKE ? OR email LIKE ?";
    const filtro = `%${req.query.busqueda}%`;
    params.push(filtro, filtro);
  }

  query += " ORDER BY nombre_usuario ASC";

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 2. CAMBIAR ROL DE USUARIO
app.put("/api/admin/usuarios/:id/rol", (req, res) => {
  const { rol } = req.body; // Recibiremos 'admin' o 'cliente'
  const id_usuario = req.params.id;

  db.query(
    "UPDATE Usuarios SET rol = ? WHERE id_usuario = ?",
    [rol, id_usuario],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: "Rol actualizado correctamente" });
    },
  );
});

// OBTENER ESTADÍSTICAS PARA EL DASHBOARD
app.get("/api/admin/estadisticas", async (req, res) => {
  try {
    // Función auxiliar para poder usar async/await con tu base de datos
    const queryDB = (query) =>
      new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

    // RECOGEMOS EL MES QUE ENVÍA ANGULAR (o cogemos el actual por defecto)
    const mesFiltro = req.query.mes || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const [anio, mes] = mesFiltro.split("-");

    // 1. Mesa más popular (hacemos un JOIN para sacar su número real)
    const mesaPop = await queryDB(`
            SELECT m.numero_mesa as numero, COUNT(r.id_reserva) as reservas
            FROM Reservas r
            JOIN Mesas m ON r.id_mesa = m.id_mesa
            GROUP BY m.numero_mesa
            ORDER BY reservas DESC LIMIT 1
        `);

    // 2. Día más concurrido (DAYOFWEEK devuelve 1=Domingo, 2=Lunes...)
    const diaPop = await queryDB(`
            SELECT DAYOFWEEK(fecha_reserva) as dia_semana, COUNT(*) as reservas
            FROM Reservas
            GROUP BY dia_semana
            ORDER BY reservas DESC LIMIT 1
        `);

    // Necesitamos el total de reservas para calcular el % de ocupación de ese día
    const totalReservas = await queryDB(
      `SELECT COUNT(*) as total FROM Reservas`,
    );
    const totalRes = totalReservas[0].total > 0 ? totalReservas[0].total : 1; // Evitar dividir por cero

    // 3. Hora punta (Agrupamos por hora y minutos)
    const horaPop = await queryDB(`
            SELECT DATE_FORMAT(fecha_reserva, '%H:%i') as hora, COUNT(*) as reservas
            FROM Reservas
            GROUP BY hora
            ORDER BY reservas DESC LIMIT 1
        `);

    // 4. Usuarios: Nuevos este mes y tendencia respecto al mes pasado
    const usuariosStats = await queryDB(`
            SELECT 
                SUM(CASE WHEN YEAR(fecha_creacion) = YEAR(CURRENT_DATE()) AND MONTH(fecha_creacion) = MONTH(CURRENT_DATE()) THEN 1 ELSE 0 END) as este_mes,
                SUM(CASE WHEN YEAR(fecha_creacion) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH) AND MONTH(fecha_creacion) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) THEN 1 ELSE 0 END) as mes_pasado
            FROM Usuarios
        `);

    const esteMes = Number(usuariosStats[0].este_mes) || 0;
    const mesPasado = Number(usuariosStats[0].mes_pasado) || 0;

    // Calculamos el porcentaje matemático de crecimiento
    let tendencia = "0%";
    if (mesPasado > 0) {
      const porcentaje = Math.round(((esteMes - mesPasado) / mesPasado) * 100);
      // Si es positivo, le añadimos el "+" delante
      tendencia = porcentaje > 0 ? "+" + porcentaje + "%" : porcentaje + "%";
    } else if (esteMes > 0) {
      // Si el mes pasado hubo 0 y este mes hay nuevos, es un crecimiento del 100%
      tendencia = "+100%";
    }

    // ... (tu código anterior de usuariosStats)

    // 5. Datos para el gráfico: Reservas por día (últimos 7 días con reservas)
    // 🌟 GRÁFICO DEL MES COMPLETO (Corregido) 🌟
    const reservasGrafico = await queryDB(`
            SELECT DAY(fecha_reserva) as dia, COUNT(*) as total
            FROM Reservas
            WHERE YEAR(fecha_reserva) = ${anio} AND MONTH(fecha_reserva) = ${mes}
            GROUP BY dia
        `);

    // Calculamos cuántos días tiene ese mes (28, 29, 30 o 31)
    const diasEnMes = new Date(anio, mes, 0).getDate();

    // Le damos la vuelta para que el día más antiguo salga a la izquierda en el gráfico
    let graficoData = [];
    let maxReservas = 1;

    // Bucle para crear TODOS los días del mes, haya reservas o no
    for (let i = 1; i <= diasEnMes; i++) {
      const datoBD = reservasGrafico.find((r) => r.dia === i);
      const total = datoBD ? datoBD.total : 0;
      if (total > maxReservas) maxReservas = total;
      graficoData.push({ dia: i, total: total });
    }

    const graficoFinal = graficoData.map((d) => ({
      dia: d.dia,
      total: d.total,
      porcentaje: Math.round((d.total / maxReservas) * 100), // Calcula la altura de la barra
    }));

    const diasEspanol = {
      1: "Domingo",
      2: "Lunes",
      3: "Martes",
      4: "Miércoles",
      5: "Jueves",
      6: "Viernes",
      7: "Sábado",
    };

    // Construimos el JSON final para Angular (Añadimos 'grafico')
    res.json({
      topMesa: {
        numero: mesaPop.length > 0 ? mesaPop[0].numero : "-",
        reservas: mesaPop.length > 0 ? mesaPop[0].reservas : 0,
      },
      topDia: {
        nombre: diaPop.length > 0 ? diasEspanol[diaPop[0].dia_semana] : "-",
        porcentaje:
          diaPop.length > 0
            ? Math.round((diaPop[0].reservas / totalRes) * 100)
            : 0,
      },
      topHora: {
        hora: horaPop.length > 0 ? horaPop[0].hora : "-",
        reservas: horaPop.length > 0 ? horaPop[0].reservas : 0,
      },
      nuevosUsuarios: {
        cantidad: esteMes,
        tendencia: tendencia,
      },
      grafico: graficoFinal, // <--- ¡Añadimos el array del gráfico aquí!
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({ error: "Error interno al cargar el dashboard" });
  }
});

app.listen(3000, () => console.log("API corriendo en http://localhost:3000"));
