-- SOLO PARA DESARROLLO. No ejecutes este archivo en producción.
-- Ejecútalo DESPUÉS de agenda_hub.sql.
-- Contraseña de todos los usuarios de prueba: Demo12345

USE `agenda_hub`;
SET NAMES utf8mb4; -- AGREGADO: garantiza que acentos y ñ se guarden bien sin importar el cliente

INSERT IGNORE INTO `usuarios` (`nombre`, `apellido`, `email`, `password_hash`, `rol`) VALUES
('Laura', 'Méndez', 'laura.tutor@demo.com', '$2a$10$WIupiEvpF1g.arzNgPZAnOkE9DX.jsu/gaWuZsUmrjQJnehBVvqQG', 'tutor'),
('Carlos', 'Ruiz', 'carlos.tutor@demo.com', '$2a$10$WIupiEvpF1g.arzNgPZAnOkE9DX.jsu/gaWuZsUmrjQJnehBVvqQG', 'tutor'),
('Ana', 'Torres', 'ana.estudiante@demo.com', '$2a$10$WIupiEvpF1g.arzNgPZAnOkE9DX.jsu/gaWuZsUmrjQJnehBVvqQG', 'estudiante');

SET @laura  = (SELECT id_usuario FROM usuarios WHERE email = 'laura.tutor@demo.com');
SET @carlos = (SELECT id_usuario FROM usuarios WHERE email = 'carlos.tutor@demo.com');
SET @cat    = (SELECT id_categoria FROM categorias_servicio WHERE nombre = 'Tutorías Académicas');

INSERT IGNORE INTO `tutores_perfiles` (`id_usuario`, `especialidad`, `departamento`, `cubiculo_ubicacion`, `biografia`, `estado_solicitud`) VALUES
(@laura,  'Matemáticas', 'Ciencias Básicas', 'Edificio B, cubículo 4', 'Doce años enseñando cálculo y álgebra a estudiantes de ingeniería.', 'aprobado'),
(@carlos, 'Programación', 'Sistemas Computacionales', 'Edificio K, cubículo 2', 'Asesor de estructuras de datos y bases de datos.', 'aprobado');

INSERT INTO `servicios` (`id_categoria`, `id_tutor`, `nombre_servicio`, `descripcion`, `duracion_minutos`, `modalidad`)
SELECT @cat, @laura, 'Asesoría de Cálculo', 'Límites, derivadas e integrales', 45, 'presencial'
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE id_tutor = @laura AND nombre_servicio = 'Asesoría de Cálculo');
INSERT INTO `servicios` (`id_categoria`, `id_tutor`, `nombre_servicio`, `descripcion`, `duracion_minutos`, `modalidad`)
SELECT @cat, @carlos, 'Asesoría de Bases de Datos', 'Modelo relacional y SQL', 60, 'online'
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE id_tutor = @carlos AND nombre_servicio = 'Asesoría de Bases de Datos');

INSERT IGNORE INTO `materias_servicios` (`id_materia`, `id_servicio`)
SELECT m.id_materia, s.id_servicio FROM materias m, servicios s
 WHERE m.clave IN ('ACF0901','ACF0902') AND s.id_tutor = @laura AND s.nombre_servicio = 'Asesoría de Cálculo';
INSERT IGNORE INTO `materias_servicios` (`id_materia`, `id_servicio`)
SELECT m.id_materia, s.id_servicio FROM materias m, servicios s
 WHERE m.clave IN ('AEF1031','SCA1025') AND s.id_tutor = @carlos AND s.nombre_servicio = 'Asesoría de Bases de Datos';

-- Horarios semanales (solo se insertan si el tutor aún no tiene ninguno)
INSERT INTO `horarios_disponibilidad` (`id_tutor`, `dia_semana`, `hora_inicio`, `hora_fin`)
SELECT @laura, d, '10:00', '14:00' FROM (SELECT 'Lunes' d UNION SELECT 'Miercoles') x
WHERE NOT EXISTS (SELECT 1 FROM horarios_disponibilidad WHERE id_tutor = @laura);
INSERT INTO `horarios_disponibilidad` (`id_tutor`, `dia_semana`, `hora_inicio`, `hora_fin`)
SELECT @carlos, d, '16:00', '19:00' FROM (SELECT 'Martes' d UNION SELECT 'Jueves') x
WHERE NOT EXISTS (SELECT 1 FROM horarios_disponibilidad WHERE id_tutor = @carlos);
