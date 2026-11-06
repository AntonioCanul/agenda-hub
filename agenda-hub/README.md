# Agenda-hub

Plataforma de asesorías y tutorías. Front-end en HTML/CSS/JavaScript puro, backend en **Node.js + Express** y base de datos **MySQL**.

## Estructura

```
agenda-hub/
├── public/            Front-end (lo único que ve el navegador)
├── server/            Backend (API)
│   ├── server.js
│   ├── db.js
│   ├── middleware/
│   └── routes/        auth.js, tutores.js
├── database/
│   ├── agenda_hub.sql     Estructura + datos semilla
│   └── datos_prueba.sql   Tutores y estudiante de ejemplo (solo desarrollo)
├── .env.example       Plantilla de configuración
└── BD.md              Diagrama ER (Mermaid)
```

## Puesta en marcha

1. Instala **Node.js 18+** y **MySQL 8** (o MariaDB 10.5+).
2. Crea la base de datos:
   ```bash
   mysql -u root -p < database/agenda_hub.sql
   mysql -u root -p < database/datos_prueba.sql   # opcional, solo desarrollo
   ```
3. Crea un usuario de MySQL para la aplicación (no uses `root`):
   ```sql
   CREATE USER 'agenda_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
   GRANT SELECT, INSERT, UPDATE, DELETE ON agenda_hub.* TO 'agenda_user'@'localhost';
   ```
4. Copia `.env.example` a `.env` y llena tus datos (incluye un `JWT_SECRET` largo y aleatorio).
5. Instala y ejecuta:
   ```bash
   npm install
   npm start
   ```
6. Abre http://localhost:3000

Usuarios de prueba (si importaste `datos_prueba.sql`), contraseña `Demo12345`:
`laura.tutor@demo.com`, `carlos.tutor@demo.com`, `ana.estudiante@demo.com`.

## API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/registro` | Crea cuenta de estudiante e inicia sesión |
| POST | `/api/auth/login` | Inicia sesión |
| POST | `/api/auth/logout` | Cierra sesión |
| GET | `/api/auth/me` | Usuario con sesión activa |
| POST | `/api/tutores/solicitud` | Envía solicitud para ser tutor (requiere sesión) |
| GET | `/api/tutores?q=&fecha=` | Busca tutores aprobados por texto y/o fecha |

## Aprobar una solicitud de tutor

Todavía no hay panel de administración. Mientras tanto, aprueba desde SQL (cambia `ID`):

```sql
START TRANSACTION;
UPDATE tutores_perfiles SET estado_solicitud = 'aprobado' WHERE id_usuario = ID;
UPDATE usuarios SET rol = 'tutor' WHERE id_usuario = ID;
COMMIT;
```

## Seguridad

- Contraseñas con **bcrypt**; nunca se guardan en texto plano.
- Sesión en cookie **httpOnly** (JavaScript no puede leerla); con `NODE_ENV=production` solo viaja por HTTPS.
- Todas las consultas SQL son **parametrizadas**.
- Límite de intentos en login y registro.
- **Nunca subas `.env` a GitHub** (ya está en `.gitignore`).
