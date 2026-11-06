const express = require("express");

// Express 4 no captura errores de funciones async. Este router los envía
// al manejador de errores central en lugar de tumbar el servidor.
function routerSeguro() {
  const router = express.Router();
  for (const metodo of ["get", "post", "put", "patch", "delete"]) {
    const original = router[metodo].bind(router);
    router[metodo] = (ruta, ...manejadores) =>
      original(
        ruta,
        ...manejadores.map((fn) => (req, res, next) =>
          Promise.resolve(fn(req, res, next)).catch(next)
        )
      );
  }
  return router;
}

module.exports = routerSeguro;
