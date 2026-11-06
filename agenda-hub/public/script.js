const searchForm = document.getElementById("searchForm");
const subjectInput = document.getElementById("subject");
const dateInput = document.getElementById("date");
const searchMessage = document.getElementById("searchMessage");
const resultsSection = document.getElementById("resultados");
const resultsList = document.getElementById("resultsList");

// Crea un elemento de texto de forma segura (textContent, nunca innerHTML)
function el(etiqueta, clase, contenido) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (contenido !== undefined) nodo.textContent = contenido;
  return nodo;
}

function tarjetaTutor(t) {
  const tarjeta = el("article", "tutor-card");

  const cabecera = el("div", "tutor-head");
  cabecera.append(el("span", "tutor-avatar", (t.nombre[0] + t.apellido[0]).toUpperCase()));
  const titulo = el("div");
  titulo.append(el("h3", "", `${t.nombre} ${t.apellido}`), el("p", "tutor-specialty", t.especialidad));
  cabecera.append(titulo);
  tarjeta.append(cabecera);

  const valoracion = t.total_valoraciones > 0
    ? `★ ${t.promedio} (${t.total_valoraciones} ${t.total_valoraciones === 1 ? "valoración" : "valoraciones"})`
    : "Sin valoraciones aún";
  tarjeta.append(el("p", "tutor-rating", valoracion));

  const datos = [t.departamento, t.ubicacion].filter(Boolean).join(" · ");
  if (datos) tarjeta.append(el("p", "tutor-meta", datos));
  if (t.biografia) tarjeta.append(el("p", "tutor-bio", t.biografia));

  if (t.servicios && t.servicios.length) {
    const lista = el("ul", "tutor-services");
    for (const s of t.servicios) {
      lista.append(el("li", "", `${s.nombre} · ${s.duracion} min · ${s.modalidad}`));
    }
    tarjeta.append(lista);
  }
  return tarjeta;
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const subject = subjectInput.value.trim();
  const date = dateInput.value;

  if (!subject && !date) {
    searchMessage.textContent = "Escribe una materia, tema o nombre de tutor, o elige una fecha.";
    subjectInput.focus();
    return;
  }

  searchMessage.textContent = "Buscando...";
  const params = new URLSearchParams();
  if (subject) params.set("q", subject);
  if (date) params.set("fecha", date);

  const { ok, data } = await api(`/api/tutores?${params}`);
  if (!ok) {
    searchMessage.textContent = data.error || "No se pudo realizar la búsqueda.";
    return;
  }

  const formattedDate = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const criterios = [subject, formattedDate].filter(Boolean).join(" · ");

  resultsList.replaceChildren();
  resultsSection.hidden = false;

  if (!data.tutores.length) {
    searchMessage.textContent = `No encontramos tutores para: ${criterios}.`;
    resultsList.append(el("p", "no-results", "No hay tutores que coincidan. Prueba con otra materia o fecha."));
  } else {
    searchMessage.textContent = `${data.tutores.length} ${data.tutores.length === 1 ? "tutor encontrado" : "tutores encontrados"}: ${criterios}.`;
    for (const t of data.tutores) resultsList.append(tarjetaTutor(t));
  }
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Si hay sesión iniciada, el encabezado muestra tu nombre y "Cerrar sesión"
(async function mostrarSesion() {
  const { ok, data } = await api("/api/auth/me");
  if (!ok || !data.usuario) return;

  const perfil = document.querySelector(".profile-link");
  const cuenta = document.querySelector(".create-account");
  if (perfil) {
    perfil.textContent = `Hola, ${data.usuario.nombre}`;
    perfil.removeAttribute("href");
  }
  if (cuenta) {
    cuenta.textContent = "Cerrar sesión";
    cuenta.href = "#";
    cuenta.addEventListener("click", async (e) => {
      e.preventDefault();
      await api("/api/auth/logout", { method: "POST" });
      window.location.reload();
    });
  }
})();
