const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = registerForm.elements.password.value;
  const confirmPassword = registerForm.elements.confirmPassword.value;

  if (password !== confirmPassword) {
    registerMessage.textContent = "Las contraseñas no coinciden. Verifica los campos.";
    registerForm.elements.confirmPassword.focus();
    return;
  }

  const boton = registerForm.querySelector("button[type=submit]");
  boton.disabled = true;
  registerMessage.textContent = "Creando tu cuenta...";

  const { ok, data } = await api("/api/auth/registro", {
    method: "POST",
    body: {
      nombre: registerForm.elements.nombre.value,
      apellido: registerForm.elements.apellido.value,
      email: registerForm.elements.email.value,
      password
    }
  });

  if (ok) {
    window.location.href = "index.html"; // el servidor ya inició tu sesión
    return;
  }
  registerMessage.textContent = data.error || "No se pudo crear la cuenta.";
  boton.disabled = false;
});
