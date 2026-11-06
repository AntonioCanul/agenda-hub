const routerSeguro = require("../middleware/routerSeguro");
const pool = require("../db");
const { requiereLogin } = require("../middleware/auth");

const router = routerSeguro();
const texto = (valor) => (typeof valor === "string" ? valor.trim() : "");

// Los ENUM de la base de datos no llevan acentos ('Miercoles', 'Sabado')
const DIAS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

// Escapa % y _ para que se busquen como texto normal dentro de un LIKE
const escaparLike = (s) => s.replace(/[\\%_]/g, "\\$&");

// POST /api/tutores/solicitud  (requiere sesión)
// Guarda la solicitud para ser tutor en la tabla tutores_perfiles con estado 'pendiente'.
router.post("/solicitud", requiereLogin, async (req, res) => {
  const especialidad = texto(req.body.especialidad);
  const departamento = texto(req.body.departamento) || null;
  const numEmpleado = texto(req.body.num_empleado_cedula) || null;
  const cubiculo = texto(req.body.cubiculo_ubicacion) || null;
  const biografia = texto(req.body.biografia) || null;

  if (!especialidad) return res.status(400).json({ error: "Indica tu especialidad." });
  if (especialidad.length > 150 || (departamento && departamento.length > 100) ||
      (numEmpleado && numEmpleado.length > 50) || (cubiculo && cubiculo.length > 100) ||
      (biografia && biografia.length > 3000))
    return res.status(400).json({ error: "Algún campo supera la longitud permitida." });

  const [existente] = await pool.execute(
    "SELECT estado_solicitud FROM tutores_perfiles WHERE id_usuario = ?",
    [req.usuario.id]
  );

  if (existente.length) {
    const estado = existente[0].estado_solicitud;
    if (estado === "pendiente") return res.status(409).json({ error: "Ya tienes una solicitud en revisión." });
    if (estado === "aprobado") return res.status(409).json({ error: "Tu solicitud ya fue aprobada." });
    // Si fue rechazada, permite volver a enviarla con datos actualizados
    await pool.execute(
      `UPDATE tutores_perfiles
          SET especialidad = ?, departamento = ?, num_empleado_cedula = ?, cubiculo_ubicacion = ?,
              biografia = ?, estado_solicitud = 'pendiente', fecha_solicitud = NOW()
        WHERE id_usuario = ?`,
      [especialidad, departamento, numEmpleado, cubiculo, biografia, req.usuario.id]
    );
    return res.json({ mensaje: "Tu solicitud fue enviada de nuevo y está en revisión." });
  }

  await pool.execute(
    `INSERT INTO tutores_perfiles
       (id_usuario, num_empleado_cedula, especialidad, cubiculo_ubicacion, departamento, biografia)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.usuario.id, numEmpleado, especialidad, cubiculo, departamento, biografia]
  );
  res.status(201).json({ mensaje: "Solicitud enviada. Un administrador la revisará pronto." });
});

// GET /api/tutores?q=texto&fecha=YYYY-MM-DD
// Lista tutores aprobados. Filtra por nombre, especialidad, materia o servicio, y por disponibilidad en una fecha.
router.get("/", async (req, res) => {
  const q = texto(req.query.q).slice(0, 100);
  const fecha = texto(req.query.fecha);

  const condiciones = [];
  const params = [];

  if (q) {
    const like = `%${escaparLike(q)}%`;
    condiciones.push(`(
      CONCAT(u.nombre, ' ', u.apellido) LIKE ?
      OR tp.especialidad LIKE ?
      OR EXISTS (
        SELECT 1 FROM servicios s
        LEFT JOIN materias_servicios ms ON ms.id_servicio = s.id_servicio
        LEFT JOIN materias m ON m.id_materia = ms.id_materia
        WHERE s.id_tutor = u.id_usuario AND s.estado = 'activo'
          AND (s.nombre_servicio LIKE ? OR m.nombre LIKE ? OR m.clave LIKE ?)
      )
    )`);
    params.push(like, like, like, like, like);
  }

  if (fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha)))
      return res.status(400).json({ error: "La fecha no es válida." });
    const dia = DIAS[new Date(`${fecha}T12:00:00`).getDay()];
    // Con horario abierto ese día (semanal o fecha específica) y sin bloqueo en esa fecha
    condiciones.push(`(
      EXISTS (
        SELECT 1 FROM horarios_disponibilidad h
        WHERE h.id_tutor = u.id_usuario AND h.es_bloqueo = 0
          AND (h.fecha_especifica = ? OR (h.fecha_especifica IS NULL AND h.dia_semana = ?))
      )
      AND NOT EXISTS (
        SELECT 1 FROM horarios_disponibilidad b
        WHERE b.id_tutor = u.id_usuario AND b.es_bloqueo = 1 AND b.fecha_especifica = ?
      )
    )`);
    params.push(fecha, dia, fecha);
  }

  const [tutores] = await pool.query(
    `SELECT u.id_usuario AS id, u.nombre, u.apellido,
            tp.especialidad, tp.departamento, tp.cubiculo_ubicacion AS ubicacion, tp.biografia,
            (SELECT ROUND(AVG(v.calificacion), 1) FROM valoraciones v WHERE v.id_tutor = u.id_usuario) AS promedio,
            (SELECT COUNT(*) FROM valoraciones v WHERE v.id_tutor = u.id_usuario) AS total_valoraciones
       FROM usuarios u
       JOIN tutores_perfiles tp ON tp.id_usuario = u.id_usuario AND tp.estado_solicitud = 'aprobado'
      WHERE u.estado = 'activo' AND u.rol = 'tutor'
        ${condiciones.length ? "AND " + condiciones.join(" AND ") : ""}
      ORDER BY promedio IS NULL, promedio DESC, u.nombre
      LIMIT 50`,
    params
  );

  // Servicios activos de los tutores encontrados (una sola consulta extra)
  if (tutores.length) {
    const [servicios] = await pool.query(
      `SELECT id_servicio AS id, id_tutor, nombre_servicio AS nombre, duracion_minutos AS duracion, modalidad
         FROM servicios WHERE estado = 'activo' AND id_tutor IN (?)
        ORDER BY nombre_servicio`,
      [tutores.map((t) => t.id)]
    );
    for (const t of tutores) t.servicios = servicios.filter((s) => s.id_tutor === t.id);
  }

  res.json({ tutores });
});

module.exports = router;
