const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const formMessage = document.getElementById("formMessage");

togglePassword.addEventListener("click", () => {
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  togglePassword.textContent = showing ? "Mostrar" : "Ocultar";
  togglePassword.setAttribute("aria-label", showing ? "Mostrar contraseña" : "Ocultar contraseña");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;

  const boton = loginForm.querySelector("button[type=submit]");
  boton.disabled = true;
  formMessage.textContent = "Verificando...";

  const { ok, data } = await api("/api/auth/login", {
    method: "POST",
    body: {
      email: document.getElementById("email").value.trim(),
      password: passwordInput.value,
      recordar: loginForm.elements.remember.checked
    }
  });

  if (ok) {
    window.location.href = "index.html";
    return;
  }
  formMessage.textContent = data.error || "No se pudo iniciar sesión.";
  boton.disabled = false;
});
