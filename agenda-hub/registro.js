const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const password = registerForm.elements.password.value;
  const confirmPassword = registerForm.elements.confirmPassword.value;

  if (password !== confirmPassword) {
    registerMessage.textContent = "Las contraseñas no coinciden. Verifica los campos.";
    registerForm.elements.confirmPassword.focus();
    return;
  }

  registerMessage.textContent = "Formulario validado. Para crear cuentas reales, conecta este formulario a un backend seguro.";
  registerForm.reset();
});
