const routerSeguro = require("../middleware/routerSeguro");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const pool = require("../db");
const { COOKIE_NAME, crearSesion, leerSesion } = require("../middleware/auth");

const router = routerSeguro();

// Máximo 20 intentos cada 15 minutos por IP (frena ataques de fuerza bruta)
const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." }
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texto = (valor) => (typeof valor === "string" ? valor.trim() : "");

// Un hash válido para comparar cuando el correo no existe
const HASH_FALSO = bcrypt.hashSync("contraseña-falsa-para-igualar-tiempos", 10);

// POST /api/auth/registro
router.post("/registro", limitador, async (req, res) => {
  const nombre = texto(req.body.nombre);
  const apellido = texto(req.body.apellido);
  const email = texto(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!nombre || !apellido || !email || !password)
    return res.status(400).json({ error: "Completa todos los campos." });
  if (nombre.length > 100 || apellido.length > 100 || email.length > 150)
    return res.status(400).json({ error: "Algún campo es demasiado largo." });
  if (!EMAIL_RE.test(email))
    return res.status(400).json({ error: "El correo electrónico no es válido." });
  if (password.length < 8 || password.length > 72)
    return res.status(400).json({ error: "La contraseña debe tener entre 8 y 72 caracteres." });

  const [existente] = await pool.execute("SELECT id_usuario FROM usuarios WHERE email = ?", [email]);
  if (existente.length) return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });

  const hash = await bcrypt.hash(password, 10);
  const [resultado] = await pool.execute(
    "INSERT INTO usuarios (nombre, apellido, email, password_hash) VALUES (?, ?, ?, ?)",
    [nombre, apellido, email, hash]
  );

  const usuario = { id_usuario: resultado.insertId, rol: "estudiante" };
  crearSesion(res, usuario);
  res.status(201).json({ usuario: { id: usuario.id_usuario, nombre, apellido, rol: usuario.rol } });
});

// POST /api/auth/login
router.post("/login", limitador, async (req, res) => {
  const email = texto(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const recordar = req.body.recordar === true;

  if (!email || !password) return res.status(400).json({ error: "Escribe tu correo y contraseña." });

  const [filas] = await pool.execute(
    "SELECT id_usuario, nombre, apellido, password_hash, rol, estado FROM usuarios WHERE email = ?",
    [email]
  );
  const usuario = filas[0];
  const coincide = await bcrypt.compare(password, usuario ? usuario.password_hash : HASH_FALSO);

  if (!usuario || !coincide || usuario.estado !== "activo")
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });

  crearSesion(res, usuario, recordar);
  res.json({ usuario: { id: usuario.id_usuario, nombre: usuario.nombre, apellido: usuario.apellido, rol: usuario.rol } });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// GET /api/auth/me  -> datos del usuario con sesión activa
router.get("/me", async (req, res) => {
  const sesion = leerSesion(req);
  if (!sesion) return res.json({ usuario: null });

  // Agregué 'email' a la consulta para que puedas mostrarlo en la vista de perfil
  const [filas] = await pool.execute(
    "SELECT id_usuario, nombre, apellido, email, rol FROM usuarios WHERE id_usuario = ? AND estado = 'activo'",
    [sesion.id]
  );
  
  if (!filas.length) {
    res.clearCookie(COOKIE_NAME);
    return res.json({ usuario: null });
  }
  const u = filas[0];
  // Se retorna también el email al frontend
  res.json({ usuario: { id: u.id_usuario, nombre: u.nombre, apellido: u.apellido, correo: u.email, rol: u.rol } });
});

// PUT /api/auth/perfil -> Actualizar perfil (Nombre y apellido)
router.put('/perfil', async (req, res) => {
  const sesion = leerSesion(req);
  if (!sesion) return res.status(401).json({ error: "No autorizado" });

  const nombre = texto(req.body.nombre);
  const apellido = texto(req.body.apellido);

  if (!nombre || !apellido) {
    return res.status(400).json({ error: "El nombre y el apellido son obligatorios." });
  }

  try {
    // Usamos pool.execute e id_usuario para respetar tu base de datos original
    await pool.execute(
      'UPDATE usuarios SET nombre = ?, apellido = ? WHERE id_usuario = ?', 
      [nombre, apellido, sesion.id]
    );
    res.json({ message: "Perfil actualizado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;