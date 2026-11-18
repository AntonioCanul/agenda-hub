CREATE DATABASE IF NOT EXISTS `agenda_hub` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `agenda_hub`;
SET NAMES utf8mb4; -- AGREGADO: garantiza que acentos y ñ se guarden bien sin importar el cliente

-- 1. Usuarios (Estudiantes, Tutores, Admins)
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('estudiante', 'tutor', 'admin') NOT NULL DEFAULT 'estudiante',
  `telefono` VARCHAR(20) DEFAULT NULL,
  `foto_perfil` VARCHAR(255) DEFAULT 'default.jpg',
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `fecha_registro` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Solicitudes y Perfiles de Tutores (Basado en ser-tutor.html)
CREATE TABLE IF NOT EXISTS `tutores_perfiles` (
  `id_tutor_perfil` INT AUTO_INCREMENT PRIMARY KEY,
  `id_usuario` INT NOT NULL UNIQUE,
  `num_empleado_cedula` VARCHAR(50) DEFAULT NULL,
  `especialidad` VARCHAR(150) NOT NULL,
  `cubiculo_ubicacion` VARCHAR(100) DEFAULT NULL,
  `departamento` VARCHAR(100) DEFAULT NULL,
  `biografia` TEXT DEFAULT NULL,
  `estado_solicitud` ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  `fecha_solicitud` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Categorías de Servicio
CREATE TABLE IF NOT EXISTS `categorias_servicio` (
  `id_categoria` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `descripcion` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Materias Académicas
CREATE TABLE IF NOT EXISTS `materias` (
  `id_materia` INT AUTO_INCREMENT PRIMARY KEY,
  `clave` VARCHAR(15) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `creditos` INT NOT NULL DEFAULT 5,
  `semestre_sugerido` INT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Servicios / Asesorías ofertadas
CREATE TABLE IF NOT EXISTS `servicios` (
  `id_servicio` INT AUTO_INCREMENT PRIMARY KEY,
  `id_categoria` INT NOT NULL,
  `id_tutor` INT NOT NULL,
  `nombre_servicio` VARCHAR(150) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `duracion_minutos` INT NOT NULL DEFAULT 45,
  `modalidad` ENUM('presencial', 'online') NOT NULL DEFAULT 'presencial',
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  FOREIGN KEY (`id_categoria`) REFERENCES `categorias_servicio`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`id_tutor`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_tutor_servicio` (`id_tutor`, `estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Relación Materia - Servicio
CREATE TABLE IF NOT EXISTS `materias_servicios` (
  `id_materia` INT NOT NULL,
  `id_servicio` INT NOT NULL,
  PRIMARY KEY (`id_materia`, `id_servicio`),
  FOREIGN KEY (`id_materia`) REFERENCES `materias`(`id_materia`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_servicio`) REFERENCES `servicios`(`id_servicio`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Horarios de Disponibilidad (Semanal y por Fecha Específica)
CREATE TABLE IF NOT EXISTS `horarios_disponibilidad` (
  `id_horario` INT AUTO_INCREMENT PRIMARY KEY,
  `id_tutor` INT NOT NULL,
  `dia_semana` ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado') DEFAULT NULL,
  `fecha_especifica` DATE DEFAULT NULL, -- Para días específicos del calendario
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `es_bloqueo` TINYINT(1) DEFAULT 0, -- 1 si el tutor bloquea el día/hora por junta o imprevisto
  FOREIGN KEY (`id_tutor`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_tutor_dia` (`id_tutor`, `dia_semana`),
  INDEX `idx_tutor_fecha` (`id_tutor`, `fecha_especifica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Citas y Reservas
CREATE TABLE IF NOT EXISTS `citas` (
  `id_cita` INT AUTO_INCREMENT PRIMARY KEY,
  `id_estudiante` INT NOT NULL,
  `id_tutor` INT NOT NULL,
  `id_servicio` INT NOT NULL,
  `fecha_cita` DATE NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `estado` ENUM('pendiente', 'confirmada', 'rechazada', 'completada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  `notas_estudiante` TEXT DEFAULT NULL,
  `notas_tutor` TEXT DEFAULT NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_estudiante`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_tutor`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_servicio`) REFERENCES `servicios`(`id_servicio`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_tutor_fecha_hora` (`id_tutor`, `fecha_cita`, `hora_inicio`),
  INDEX `idx_estudiante_citas` (`id_estudiante`, `estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Reseñas y Valoraciones de Asesorías
CREATE TABLE IF NOT EXISTS `valoraciones` (
  `id_valoracion` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cita` INT NOT NULL UNIQUE,
  `id_estudiante` INT NOT NULL,
  `id_tutor` INT NOT NULL,
  `calificacion` TINYINT NOT NULL CHECK (`calificacion` BETWEEN 1 AND 5), -- CORREGIDO: antes permitía NULL
  `comentario` TEXT DEFAULT NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_cita`) REFERENCES `citas`(`id_cita`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_estudiante`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_tutor`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Mensajes Internos / Chat
CREATE TABLE IF NOT EXISTS `mensajes` (
  `id_mensaje` INT AUTO_INCREMENT PRIMARY KEY,
  `id_remitente` INT NOT NULL,
  `id_destinatario` INT NOT NULL,
  `id_cita` INT DEFAULT NULL,
  `contenido` TEXT NOT NULL,
  `leido` TINYINT(1) NOT NULL DEFAULT 0,
  `fecha_envio` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_remitente`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_destinatario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_cita`) REFERENCES `citas`(`id_cita`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos Semilla (Categorías y Materias)  -- CORREGIDO: INSERT IGNORE para poder re-ejecutar el script
INSERT IGNORE INTO `categorias_servicio` (`nombre`, `descripcion`) VALUES
('Tutorías Académicas', 'Asesorías sobre materias y temas del plan de estudio TecNM'),
('Servicios Escolares', 'Trámites administrativos y consultas de oficina'),
('Orientación Psicopedagógica', 'Apoyo profesional y acompañamiento estudiantil'),
('Biblioteca', 'Consultas y préstamo de material');

INSERT IGNORE INTO `materias` (`clave`, `nombre`, `creditos`, `semestre_sugerido`) VALUES
('ACF0901', 'Cálculo Diferencial', 5, 1),
('AED1285', 'Fundamentos de Programación', 5, 1),
('AEF1041', 'Matemáticas Discretas', 5, 1),
('ACF0903', 'Álgebra Lineal', 5, 1),
('ACF0902', 'Cálculo Integral', 5, 2),
('AED1286', 'Programación Orientada a Objetos', 5, 2),
('AEC1008', 'Contabilidad Financiera', 4, 2),
('AEC1058', 'Química', 4, 2),
('ACF0904', 'Cálculo Vectorial', 5, 3),
('AED1026', 'Estructura de Datos', 5, 3),
('SCC1013', 'Investigación de Operaciones', 4, 3),
('SCF1006', 'Física General', 5, 3),
('ACF0905', 'Ecuaciones Diferenciales', 5, 4),
('SCC1017', 'Métodos Numéricos', 4, 4),
('SCD1027', 'Tópicos Avanzados de Programación', 5, 4),
('AEF1031', 'Fundamentos de Bases de Datos', 5, 4),
('AEC1034', 'Fundamentos de Telecomunicaciones', 4, 5),
('SCA1025', 'Taller de Bases de Datos', 4, 5),
('SCD1021', 'Redes de Computadoras', 5, 6),
('SCB1001', 'Administración de Bases de Datos', 5, 6),
('SCD1004', 'Conmutación y Enrutamiento en Redes de Datos', 5, 7) ;

--mas materias agregadas a la base de datos para pruebas
INSERT IGNORE INTO 'materias' ('clave', 'nombre', 'creditos', 'semestre_sugerido') VALUES
('AEF1052', 'Probabilidad y Estadistica', 5, 3),
('AEC1061', 'Sistemas Operativos', 4, 5),
('SCA1026', 'Taller de Sistemas Operativos', 4, 6),
('SCC1023', 'Sistemas Programables', 4, 7),
('DAB2201', 'Desarrollo de aplicaciones Web', 5, 8),
('DAD2203', 'Metodos Emergentes', 5, 8),
('DAB2202', 'Desarrollo de aplicaciones moviles nativas', 5, 8),
('DAB2204', 'Desarrollo de aplicaciones moviles hibridas', 5, 9);