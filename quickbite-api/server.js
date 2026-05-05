const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const nodemailer = require("nodemailer");

// Configuración del transportador (el cartero)
const transporter = nodemailer.createTransport({
  service: "gmail", // Puedes usar 'hotmail', 'yahoo', etc.
  auth: {
    user: "isaac.gonzalez.adeva@gmail.com", // ⚠️ PON TU CORREO AQUÍ
    pass: "vvga dpdb rjbw ymih", // ⚠️ PON TU CONTRASEÑA DE APLICACIÓN AQUÍ
  },
});

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

//============================================
//                  CORREOS
//============================================

// Función para avisar a los administradores
function enviarCorreoAdmins(nombre, email, fecha, comensales, mesa) {
  // 1. Buscamos todos los correos de los administradores en la BD
  // ⚠️ Cambia 'rol = "admin"' por la columna que tú uses para diferenciar a los administradores
  db.query("SELECT email FROM Usuarios WHERE rol = 'admin'", (err, admins) => {
    if (err) {
      console.error("Error buscando admins para el correo:", err);
      return;
    }

    if (admins.length === 0) return; // Si no hay admins, no hacemos nada

    // Juntamos todos los correos separados por coma (ej: "admin1@mail.com, admin2@mail.com")
    const correosAdmins = admins.map((admin) => admin.email).join(", ");

    // 2. Preparamos el correo
    const mailOptions = {
      from: '"QuickBite Notificaciones" <isaac.gonzalez.adeva@gmail.com>', // Quien lo envía
      to: correosAdmins, // A quién se lo enviamos
      subject: `🚨 Nueva Reserva de ${nombre} - QuickBite`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #ff6b00;">¡Tienes una nueva reserva! 🍽️</h2>
          <p>Se acaba de registrar una nueva reserva en el sistema. Estos son los detalles:</p>
          <ul style="font-size: 16px; line-height: 1.6;">
            <li><strong>Cliente:</strong> ${nombre}</li>
            <li><strong>Email de contacto:</strong> ${email}</li>
            <li><strong>Fecha y Hora:</strong> ${fecha}</li>
            <li><strong>Comensales:</strong> ${comensales} personas</li>
            <li><strong>Mesa ID:</strong> ${mesa}</li>
          </ul>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 14px; color: #888;">Por favor, entra al panel de administración para confirmarla o gestionarla.</p>
        </div>
      `,
    };

    // 3. ¡Lo enviamos!
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Error enviando el correo a admins:", error);
      } else {
        console.log("✅ Correo enviado a admins:", info.response);
      }
    });
  });
}

// Función para avisar al CLIENTE de que su reserva está confirmada
function enviarCorreoConfirmacion(emailDestino, nombre, fecha, comensales) {
  // Opcional: Formatear la fecha para que se vea bonita (Depende de cómo la guardes en MySQL)
  const fechaFormateada = new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const mailOptions = {
    from: '"QuickBite Restaurante" <isaac.gonzalez.adeva@gmail.com>', // Tu correo real
    to: emailDestino, // El correo del cliente que sacamos de la BD
    subject: `✅ ¡Tu mesa en QuickBite está confirmada!`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        
        <div style="background-color: #ff6b00; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">¡Reserva Confirmada! 🍽️</h1>
        </div>

        <div style="padding: 30px; text-align: center;">
          <h2 style="color: #333;">¡Hola ${nombre}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Nos alegra comunicarte que hemos revisado tu solicitud y <strong>tu mesa ya está reservada</strong>.</p>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; display: inline-block; text-align: left; margin: 20px 0; border-left: 5px solid #ff6b00;">
            <p style="margin: 5px 0; font-size: 16px;">📅 <strong>Cuándo:</strong> ${fechaFormateada}</p>
            <p style="margin: 5px 0; font-size: 16px;">👥 <strong>Para:</strong> ${comensales} personas</p>
          </div>

          <p style="font-size: 16px;">Si necesitas cancelar o modificar la reserva, por favor, contáctanos lo antes posible.</p>
          <br>
          <p style="font-size: 18px; font-weight: bold; color: #ff6b00;">¡Te esperamos con los fuegos a tope!</p>
          <p style="font-size: 14px; color: #888;">El equipo de QuickBite 🍔</p>
        </div>
      </div>
    `,
  };

  // Enviamos el correo con Nodemailer
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(
        "❌ Error enviando correo de confirmación al cliente:",
        error,
      );
    } else {
      console.log(`✅ Correo de confirmación enviado a: ${emailDestino}`);
    }
  });
}


// Función para avisar a los administradores de que una reserva ha CAMBIADO
function enviarCorreoAdminsModificacion(nombre, email, nuevaFecha, nuevosComensales, idReserva) {
  // Buscamos a los administradores
  db.query("SELECT email FROM Usuarios WHERE rol = 'admin'", (err, admins) => {
    if (err || admins.length === 0) return;

    const correosAdmins = admins.map(admin => admin.email).join(', ');

    // Formateamos la fecha si es necesario
    const fechaFormateada = new Date(nuevaFecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

    const mailOptions = {
      from: '"QuickBite Notificaciones" <isaac.gonzalez.adeva@gmail.com>',
      to: correosAdmins,
      subject: `⚠️ Modificación en la Reserva #${idReserva} - QuickBite`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #ffaa00;">¡Una reserva ha sido modificada! 🔄</h2>
          <p>El cliente <strong>${nombre}</strong> ha modificado los datos de su reserva.</p>
          <p>Dado que ha cambiado las condiciones, <strong>el estado de la reserva ha vuelto automáticamente a "Pendiente"</strong>.</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ffaa00; margin: 20px 0;">
            <p style="margin: 0;"><strong>Nuevos detalles solicitados:</strong></p>
            <ul style="margin-top: 10px;">
              <li><strong>Nueva Fecha y Hora:</strong> ${fechaFormateada}</li>
              <li><strong>Nuevos Comensales:</strong> ${nuevosComensales}</li>
            </ul>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 14px; color: #888;">Por favor, entra al panel de administración para revisar si hay disponibilidad y volver a confirmarla.</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Error enviando el correo de modificación:", error);
      } else {
        console.log("✅ Correo de modificación enviado a admins:", info.response);
      }
    });
  });
}

// Función para avisar al CLIENTE de que su reserva ha sido cancelada por el Admin
function enviarCorreoCancelacionCliente(emailDestino, nombre, fecha) {
  const fechaFormateada = new Date(fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

  const mailOptions = {
    from: '"QuickBite Restaurante" <isaac.gonzalez.adeva@gmail.com>', 
    to: emailDestino,
    subject: `❌ Reserva Cancelada - QuickBite`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #d9534f; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Reserva Cancelada</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Lamentamos informarte que tu reserva para el <strong>${fechaFormateada}</strong> ha sido cancelada.</p>
          <p>Esto suele deberse a falta de disponibilidad de aforo en el último momento. Sentimos mucho las molestias. Si necesitas más información, no dudes en contactarnos.</p>
        </div>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if(error) console.log("❌ Error correo cancelación cliente:", error);
  });
}

// Función para avisar a los ADMINS de que un cliente ha borrado su reserva
function enviarCorreoAdminsEliminacion(nombre, fecha, comensales) {
  db.query("SELECT email FROM Usuarios WHERE rol = 'admin'", (err, admins) => {
    if (err || admins.length === 0) return;

    const correosAdmins = admins.map(admin => admin.email).join(', ');
    const fechaFormateada = new Date(fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

    const mailOptions = {
      from: '"QuickBite Notificaciones" <isaac.gonzalez.adeva@gmail.com>',
      to: correosAdmins,
      subject: `🗑️ Reserva Anulada por cliente - QuickBite`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #d9534f;">¡Un cliente ha anulado su reserva! 🗑️</h2>
          <p>El cliente <strong>${nombre}</strong> ha eliminado su reserva del sistema.</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d9534f; margin: 20px 0;">
            <p style="margin: 0;"><strong>Detalles de la reserva borrada:</strong></p>
            <ul style="margin-top: 10px;">
              <li><strong>Fecha y Hora:</strong> ${fechaFormateada}</li>
              <li><strong>Comensales:</strong> ${comensales}</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #888;">Esta reserva ya no existe en la base de datos y la mesa vuelve a estar libre para otros clientes.</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if(error) console.log("❌ Error correo eliminación admins:", error);
    });
  });
}

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
  const {
    nombre_cliente,
    email_cliente,
    fecha_reserva,
    num_comensales,
    id_mesa,
    id_usuario,
  } = req.body;

  const usuario_id = id_usuario || null;

  // --- REGLA 1: NO RESERVAR EN EL PASADO ---
  const fechaReservaDate = new Date(fecha_reserva);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Quitamos la hora para comparar solo el día

  if (fechaReservaDate < hoy) {
    return res
      .status(400)
      .json({ error: "No puedes realizar reservas en fechas pasadas." });
  }

  // --- REGLA 2: NO RESERVAR COMO INVITADO SI EL EMAIL YA TIENE CUENTA ---
  if (!usuario_id && email_cliente) {
    db.query(
      "SELECT id_usuario FROM Usuarios WHERE email = ?",
      [email_cliente],
      (err, results) => {
        if (err) return res.status(500).send(err);

        if (results.length > 0) {
          return res
            .status(400)
            .json({
              error:
                "Este correo ya tiene una cuenta registrada. Por favor, inicia sesión para reservar.",
            });
        }

        // Si el email no existe, creamos la reserva
        insertarReserva();
      },
    );
  } else {
    // Si ya está logueado o no mandó email (raro), creamos la reserva directamente
    insertarReserva();
  }

  // Función auxiliar para no repetir código
  function insertarReserva() {
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

        // 2. ENVIAR CORREO A LOS ADMINS (En segundo plano)
        enviarCorreoAdmins(
          nombre_cliente,
          email_cliente,
          fecha_reserva,
          num_comensales,
          id_mesa,
        );
      },
    );
  }
});

// Ruta para ver la carta (PÚBLICA)
app.get("/api/carta", (req, res) => {
  const query = `
    SELECT 
      p.id_plato,
      p.id_categoria, 
      p.nombre AS nombre_plato,
      p.descripcion,
      p.precio,
      p.url_imagen,
      c.nombre AS nombre_categoria,
      
      -- Buscamos el descuento en orden de prioridad
      COALESCE(op.porcentaje_descuento, oc.porcentaje_descuento, og.porcentaje_descuento, 0) AS porcentaje_descuento,
      
      -- Calculamos el precio final
      p.precio - (p.precio * COALESCE(op.porcentaje_descuento, oc.porcentaje_descuento, og.porcentaje_descuento, 0) / 100) AS precio_final

    FROM Platos p
    JOIN Categorias c ON p.id_categoria = c.id_categoria
    
    -- 1. Oferta específica del plato
    LEFT JOIN Ofertas op ON op.id_plato = p.id_plato AND op.activa = 1
    
    -- 2. Oferta de la categoría
    LEFT JOIN Ofertas oc ON oc.id_categoria = p.id_categoria AND oc.activa = 1
    
    -- 3. Oferta Global (las que tienen plato y categoria en NULL)
    LEFT JOIN Ofertas og ON og.id_plato IS NULL AND og.id_categoria IS NULL AND og.activa = 1

    WHERE p.disponible = 1
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error en la consulta de la carta:", err);
      return res
        .status(500)
        .json({ error: "Error al consultar la base de datos" });
    }

    // Agrupar los platos por categoria (como lo tenías antes)
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
    SELECT 
      p.*, 
      c.nombre AS nombre_categoria,
      
      -- Buscamos el descuento en orden de prioridad
      COALESCE(op.porcentaje_descuento, oc.porcentaje_descuento, og.porcentaje_descuento, 0) AS porcentaje_descuento,
      
      -- Calculamos el precio final directamente
      p.precio - (p.precio * COALESCE(op.porcentaje_descuento, oc.porcentaje_descuento, og.porcentaje_descuento, 0) / 100) AS precio_final

    FROM Platos p
    JOIN Categorias c ON p.id_categoria = c.id_categoria
    
    -- 1. Oferta específica del plato
    LEFT JOIN Ofertas op ON op.id_plato = p.id_plato AND op.activa = 1
    
    -- 2. Oferta de la categoría
    LEFT JOIN Ofertas oc ON oc.id_categoria = p.id_categoria AND oc.activa = 1
    
    -- 3. Oferta Global (las que tienen plato y categoria en NULL)
    LEFT JOIN Ofertas og ON og.id_plato IS NULL AND og.id_categoria IS NULL AND og.activa = 1
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

  const cat = id_categoria || null;
  const plato = id_plato || null;

  // --- REGLA 3: NO DUPLICAR OFERTAS EN UN MISMO PLATO ---
  if (plato && activa) {
    db.query(
      "SELECT id_oferta FROM Ofertas WHERE id_plato = ? AND activa = 1",
      [plato],
      (err, results) => {
        if (err) return res.status(500).send(err);

        if (results.length > 0) {
          return res
            .status(400)
            .json({
              error:
                "Este plato ya tiene una oferta activa. Desactiva la anterior primero.",
            });
        }

        insertarOferta();
      },
    );
  } else {
    insertarOferta();
  }

  function insertarOferta() {
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
  }
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

// Actualizar una reserva (Cambiar fecha, hora, comensales o mesa)
app.put("/api/reservas/:id", (req, res) => {
  const id_reserva = req.params.id;
  const { num_comensales, fecha_reserva, id_mesa } = req.body;

  // 1. Comprobamos si la mesa está libre
  const checkQuery = "SELECT * FROM Reservas WHERE id_mesa = ? AND fecha_reserva = ? AND id_reserva != ?";
  
  db.query(checkQuery, [id_mesa, fecha_reserva, id_reserva], (err, results) => {
    if (err) {
      console.error("Error al comprobar mesa:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "La mesa ya está reservada para ese día y hora." });
    }

    // 2. Actualizamos la reserva añadiendo id_mesa y forzando el estado a 'Pendiente'
    const updateQuery = `
      UPDATE Reservas 
      SET num_comensales = ?, fecha_reserva = ?, id_mesa = ?, estado = 'Pendiente' 
      WHERE id_reserva = ?
    `;
    
    db.query(updateQuery, [num_comensales, fecha_reserva, id_mesa, id_reserva], (updateErr) => {
      if (updateErr) {
        console.error("Error al actualizar:", updateErr);
        return res.status(500).json({ error: updateErr.message });
      }

      // 3. Respondemos rápido al frontend
      res.json({ mensaje: "Reserva actualizada con éxito y devuelta a Pendiente" });

      // 4. MAGIA DE CORREOS: Avisamos a los admins del cambio
      db.query("SELECT nombre_cliente, email_cliente FROM Reservas WHERE id_reserva = ?", [id_reserva], (err, datos) => {
        if (!err && datos.length > 0) {
          const cliente = datos[0];
          
          // Usamos la función que creamos en el paso anterior
          enviarCorreoAdminsModificacion(
            cliente.nombre_cliente, 
            cliente.email_cliente, 
            fecha_reserva, 
            num_comensales, 
            id_reserva
          );
        }
      });
    });
  });
});

// 2. ELIMINAR una reserva (Acción del cliente)
app.delete("/api/reservas/:id", (req, res) => {
  const idReserva = req.params.id;

  // 1. PRIMERO SACAMOS LOS DATOS ANTES DE BORRARLA (El truco vital)
  db.query("SELECT nombre_cliente, fecha_reserva, num_comensales FROM Reservas WHERE id_reserva = ?", [idReserva], (err, datos) => {
    if (err) return res.status(500).json({ error: "Error leyendo datos previos" });
    
    if (datos.length === 0) return res.status(404).json({ error: "Reserva no encontrada" });
    
    const reservaEliminada = datos[0]; // Guardamos los datos temporalmente

    // 2. AHORA SÍ, LA BORRAMOS DE LA BBDD
    db.query("DELETE FROM Reservas WHERE id_reserva = ?", [idReserva], (delErr) => {
      // Usamos send(err) como tenías en tu código original para mantener tu estilo
      if (delErr) return res.status(500).send(delErr);

      res.json({ mensaje: "Reserva cancelada y eliminada con éxito" });

      // 3. ENVIAMOS EL CORREO A LOS ADMINS (Con los datos guardados)
      enviarCorreoAdminsEliminacion(
        reservaEliminada.nombre_cliente, 
        reservaEliminada.fecha_reserva, 
        reservaEliminada.num_comensales
      );
    });
  });
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

// 2. CAMBIAR EL ESTADO DE UNA RESERVA (Confirmar / Cancelar)
app.put("/api/admin/reservas/:id/estado", (req, res) => {
  const { estado } = req.body; // Recibirá 'Confirmada', 'Rechazada' o 'Cancelada'
  const id_reserva = req.params.id;

  const query = "UPDATE Reservas SET estado = ? WHERE id_reserva = ?";
  db.query(query, [estado, id_reserva], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    // 1. Respondemos rápido al admin
    res.json({ mensaje: `Reserva ${estado.toLowerCase()} con éxito` });

    // 2. MAGIA DE CORREOS
    db.query(
      "SELECT nombre_cliente, email_cliente, fecha_reserva, num_comensales FROM Reservas WHERE id_reserva = ?",
      [id_reserva],
      (err, datos) => {
        if (err) {
          console.error("Error buscando datos para el correo:", err);
          return;
        }

        if (datos.length > 0 && datos[0].email_cliente) {
          const reserva = datos[0];
          
          if (estado === "Confirmada") {
            // Si confirma, el correo que ya tenías
            enviarCorreoConfirmacion(
              reserva.email_cliente,
              reserva.nombre_cliente,
              reserva.fecha_reserva,
              reserva.num_comensales
            );
          } else if (estado === "Cancelada") {
            // 👇 NUEVO: Si cancela o rechaza, correo de disculpa
            enviarCorreoCancelacionCliente(
              reserva.email_cliente,
              reserva.nombre_cliente,
              reserva.fecha_reserva
            );
          }
        }
      }
    );
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
