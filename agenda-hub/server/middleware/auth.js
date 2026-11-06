const jwt = require("jsonwebtoken");

const COOKIE_NAME = "agenda_token";

function cookieOptions(recordar) {
  const opciones = {
    httpOnly: true,                                   // JavaScript del navegador no puede leerla
    sameSite: "lax",                                  // protección básica contra CSRF
    secure: process.env.NODE_ENV === "production"     // solo HTTPS en producción
  };
  if (recordar) opciones.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días; si no, dura mientras el navegador esté abierto
  return opciones;
}

function crearSesion(res, usuario, recordar = false) {
  const token = jwt.sign(
    { id: usuario.id_usuario, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: recordar ? "7d" : "12h" }
  );
  res.cookie(COOKIE_NAME, token, cookieOptions(recordar));
}

function leerSesion(req) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Exige haber iniciado sesión
function requiereLogin(req, res, next) {
  const sesion = leerSesion(req);
  if (!sesion) return res.status(401).json({ error: "Debes iniciar sesión." });
  req.usuario = sesion;
  next();
}

module.exports = { COOKIE_NAME, crearSesion, leerSesion, requiereLogin };
