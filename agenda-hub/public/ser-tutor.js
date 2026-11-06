const tutorForm = document.getElementById("tutorForm");
const tutorMessage = document.getElementById("tutorMessage");

tutorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!tutorForm.reportValidity()) return;

  const boton = tutorForm.querySelector("button[type=submit]");
  boton.disabled = true;
  tutorMessage.textContent = "Enviando solicitud...";

  const { ok, status, data } = await api("/api/tutores/solicitud", {
    method: "POST",
    body: {
      especialidad: tutorForm.elements.especialidad.value,
      departamento: tutorForm.elements.departamento.value,
      num_empleado_cedula: tutorForm.elements.num_empleado_cedula.value,
      cubiculo_ubicacion: tutorForm.elements.cubiculo_ubicacion.value,
      biografia: tutorForm.elements.biografia.value
    }
  });

  boton.disabled = false;

  if (ok) {
    tutorMessage.textContent = data.mensaje;
    tutorForm.reset();
    return;
  }

  if (status === 401) {
    // Necesita cuenta para vincular la solicitud a un usuario
    tutorMessage.textContent = "Para enviar la solicitud debes ";
    const enlace = document.createElement("a");
    enlace.href = "login.html";
    enlace.textContent = "iniciar sesión";
    tutorMessage.append(enlace, " o ");
    const registro = document.createElement("a");
    registro.href = "registro.html";
    registro.textContent = "crear una cuenta";
    tutorMessage.append(registro, ".");
    return;
  }
  tutorMessage.textContent = data.error || "No se pudo enviar la solicitud.";
});
