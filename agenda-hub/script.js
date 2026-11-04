const searchForm = document.getElementById("searchForm");
const subjectInput = document.getElementById("subject");
const dateInput = document.getElementById("date");
const searchMessage = document.getElementById("searchMessage");

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const subject = subjectInput.value.trim();
  const date = dateInput.value;

  if (!subject) {
    searchMessage.textContent = "Escribe una materia, tema o nombre de tutor para comenzar.";
    subjectInput.focus();
    return;
  }

  const formattedDate = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "cualquier fecha";

  searchMessage.textContent = `Búsqueda de demostración: ${subject} · ${formattedDate}.`;
});
