const tutorForm = document.getElementById("tutorForm");
const tutorMessage = document.getElementById("tutorMessage");

tutorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!tutorForm.reportValidity()) return;

  tutorMessage.textContent = "Solicitud completada como demostración. Para recibir y revisar solicitudes reales, conecta el formulario a un backend.";
  tutorForm.reset();
});
