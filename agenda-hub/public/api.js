// Ayudante compartido para hablar con el servidor (backend).
// Devuelve { ok, status, data }. Nunca lanza error: si el servidor no responde, ok = false.
async function api(ruta, { method = "GET", body } = {}) {
  try {
    const respuesta = await fetch(ruta, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin"
    });
    const data = await respuesta.json().catch(() => ({}));
    return { ok: respuesta.ok, status: respuesta.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "No se pudo conectar con el servidor. ¿Está encendido?" } };
  }
}
