# Requerimientos Ajustados - SIGERA

## 1. Descripcion general

SIGERA, Sistema de Gestion para Refugios de Animales, sera una aplicacion web orientada a la administracion integral de refugios de animales domesticos. El sistema permitira gestionar animales rescatados, historial medico, inventario de suministros, adopciones, usuarios internos y un apartado publico para consultar animales disponibles para adopcion.

El ajuste principal frente al alcance inicial es que el modulo de adopciones no se limita a la administracion interna. Tambien incluye un catalogo publico, una pantalla de detalle del animal y un formulario de solicitud para posibles adoptantes.

## 2. Objetivo general

Desarrollar una aplicacion web que centralice la informacion operativa de un refugio de animales domesticos y facilite el proceso de adopcion mediante la publicacion de animales disponibles y la recepcion de solicitudes de adoptantes.

## 3. Alcance ajustado del sistema

El sistema cubrira los siguientes modulos:

- Autenticacion y control de acceso por roles.
- Dashboard administrativo.
- Gestion de animales.
- Expediente individual del animal.
- Historial medico y control veterinario.
- Inventario de suministros.
- Gestion interna de adopciones.
- Catalogo publico de animales disponibles.
- Solicitud publica de adopcion.
- Gestion de adoptantes.
- Gestion de usuarios internos.
- Reportes basicos.

## 4. Roles del sistema

| Rol | Descripcion | Permisos principales |
| --- | --- | --- |
| Administrador | Usuario con control total del sistema. | Gestionar usuarios, animales, inventario, adopciones, reportes y configuraciones. |
| Voluntario | Usuario operativo del refugio. | Registrar animales, consultar expedientes, actualizar ubicacion y reportar consumo de suministros. |
| Veterinario | Usuario encargado del control medico. | Registrar consultas, vacunas, tratamientos, diagnosticos y aptitud para adopcion. |
| Adoptante / Visitante | Usuario externo interesado en adoptar. | Consultar animales disponibles y enviar solicitudes de adopcion. |

## 5. Requerimientos funcionales generales

| ID | Requerimiento | Prioridad |
| --- | --- | --- |
| RF-01 | El sistema debe permitir iniciar sesion mediante correo y contrasena. | Alta |
| RF-02 | El sistema debe controlar el acceso segun rol: administrador, voluntario y veterinario. | Alta |
| RF-03 | El sistema debe permitir registrar animales con nombre, especie, raza, edad aproximada, sexo, tamano, fotografia, comportamiento, estado y ubicacion. | Alta |
| RF-04 | El sistema debe permitir consultar, editar y eliminar registros de animales segun permisos. | Alta |
| RF-05 | El sistema debe permitir buscar y filtrar animales por nombre, codigo, especie, sexo, tamano, estado y disponibilidad. | Media |
| RF-06 | El sistema debe permitir registrar historial medico, vacunas, desparasitaciones, tratamientos, diagnosticos y observaciones. | Alta |
| RF-07 | El sistema debe permitir marcar si un animal esta apto o no apto para adopcion. | Alta |
| RF-08 | El sistema debe permitir cambiar el estado del animal: ingresado, en observacion, en tratamiento, disponible, en proceso de adopcion, adoptado, fallecido o perdido. | Alta |
| RF-09 | El sistema debe permitir gestionar inventario de alimentos, medicamentos, articulos de limpieza y otros suministros. | Alta |
| RF-10 | El sistema debe registrar entradas y salidas de inventario. | Alta |
| RF-11 | El sistema debe calcular automaticamente el stock actual de cada suministro. | Alta |
| RF-12 | El sistema debe mostrar alertas visuales cuando un suministro llegue al stock minimo. | Media |
| RF-13 | El sistema debe permitir registrar adoptantes con datos personales, contacto y observaciones. | Media |
| RF-14 | El sistema debe permitir registrar solicitudes de adopcion asociadas a un animal. | Alta |
| RF-15 | El sistema debe permitir aprobar, rechazar o cancelar solicitudes de adopcion. | Alta |
| RF-16 | El sistema debe permitir formalizar una adopcion vinculando un animal con un adoptante. | Alta |
| RF-17 | Al formalizar una adopcion, el sistema debe cambiar el estado del animal a adoptado y retirarlo del catalogo publico. | Alta |
| RF-18 | El sistema debe mostrar un catalogo publico de animales disponibles para adopcion. | Alta |
| RF-19 | El catalogo publico debe permitir filtrar animales por especie, sexo, tamano y edad aproximada. | Media |
| RF-20 | El sistema debe mostrar una pantalla publica de detalle para cada animal disponible. | Alta |
| RF-21 | El sistema debe permitir enviar una solicitud de adopcion desde la pantalla publica del animal. | Alta |
| RF-22 | El sistema debe mostrar un dashboard con total de animales, animales disponibles, adopciones del mes, alertas medicas y stock critico. | Media |
| RF-23 | El sistema debe permitir al administrador crear, editar y desactivar usuarios internos. | Media |
| RF-24 | El sistema debe permitir generar reportes basicos de animales, adopciones, salud e inventario. | Baja |

## 6. Pantallas y requerimientos por pantalla

### 6.1 Inicio de sesion

- Debe permitir ingreso con correo y contrasena.
- Debe validar campos obligatorios.
- Debe mostrar mensaje de error si las credenciales son incorrectas.
- Debe redirigir al dashboard correspondiente despues de iniciar sesion.
- Debe impedir el acceso a modulos internos sin autenticacion.
- Debe cerrar la sesion despues de 30 minutos de inactividad.

### 6.2 Dashboard administrativo

- Debe mostrar el total de animales registrados.
- Debe mostrar cantidad de animales disponibles para adopcion.
- Debe mostrar adopciones realizadas en el mes.
- Debe mostrar alertas de inventario critico.
- Debe mostrar alertas de vacunas o tratamientos pendientes.
- Debe incluir accesos rapidos a animales, inventario, adopciones, usuarios y reportes.
- Debe adaptar la informacion visible segun el rol del usuario.

### 6.3 Gestion de animales

- Debe listar todos los animales registrados.
- Debe permitir busqueda por nombre o codigo.
- Debe permitir filtros por especie, sexo, tamano, estado y disponibilidad.
- Debe permitir crear un nuevo registro de animal.
- Debe permitir editar informacion del animal.
- Debe permitir consultar el expediente completo.
- Debe permitir cambiar la ubicacion fisica del animal dentro del refugio.
- Debe restringir acciones de edicion segun el rol.

### 6.4 Registro y edicion de animal

- Debe registrar nombre, especie, raza, sexo, edad aproximada, tamano y color.
- Debe registrar fecha de ingreso al refugio.
- Debe registrar motivo de ingreso: rescate, abandono, entrega voluntaria u otro.
- Debe registrar comportamiento y observaciones generales.
- Debe registrar ubicacion fisica dentro del refugio.
- Debe permitir cargar fotografia del animal.
- Debe permitir definir el estado inicial del animal.
- Debe validar que los campos obligatorios no esten vacios.
- Debe impedir fechas futuras invalidas.

### 6.5 Expediente del animal

- Debe mostrar datos generales del animal.
- Debe mostrar fotografia principal.
- Debe mostrar estado actual.
- Debe mostrar ubicacion dentro del refugio.
- Debe mostrar historial medico resumido.
- Debe mostrar vacunas y tratamientos registrados.
- Debe mostrar proceso de adopcion asociado, si existe.
- Debe permitir marcar el animal como disponible o no disponible para adopcion.
- Debe permitir acceder a la gestion medica si el usuario tiene permiso.

### 6.6 Historial medico

- Debe permitir registrar consultas veterinarias.
- Debe permitir registrar vacunas.
- Debe permitir registrar desparasitaciones.
- Debe permitir registrar tratamientos medicos.
- Debe registrar fecha, diagnostico, medicamento, dosis y observaciones.
- Debe permitir actualizar el estado de salud del animal.
- Debe permitir indicar si el animal es apto para adopcion.
- Debe impedir modificaciones medicas a usuarios sin permiso.

### 6.7 Inventario de suministros

- Debe listar los suministros registrados.
- Debe permitir registrar alimentos, medicamentos, articulos de limpieza y otros productos.
- Debe registrar unidad de medida.
- Debe permitir configurar stock minimo.
- Debe registrar entradas por compra o donacion.
- Debe registrar salidas por consumo o uso medico.
- Debe calcular automaticamente el stock disponible.
- Debe mostrar alertas cuando el stock sea igual o inferior al minimo.
- Debe impedir cantidades negativas.

### 6.8 Adopciones internas

- Debe listar solicitudes de adopcion.
- Debe mostrar animal solicitado y datos del solicitante.
- Debe permitir cambiar el estado de una solicitud: pendiente, aprobada, rechazada o cancelada.
- Debe permitir formalizar la adopcion.
- Debe vincular el animal con el adoptante.
- Debe cambiar el estado del animal a adoptado.
- Debe registrar fecha de adopcion.
- Debe guardar observaciones del proceso.
- Debe permitir seguimiento post-adopcion.

### 6.9 Catalogo publico de adopcion

- Debe mostrar solo animales disponibles y aptos para adopcion.
- Debe mostrar fotografia, nombre, especie, sexo, edad aproximada, tamano y descripcion breve.
- Debe permitir filtrar por especie, sexo, tamano y edad aproximada.
- Debe permitir abrir el detalle publico del animal.
- Debe ocultar informacion interna del refugio.
- Debe ocultar datos clinicos sensibles.
- Debe incluir opcion para iniciar una solicitud de adopcion.
- Debe poder consultarse sin iniciar sesion, si se define como seccion publica.

### 6.10 Detalle publico del animal

- Debe mostrar informacion amigable del animal.
- Debe mostrar fotografias disponibles.
- Debe mostrar personalidad, cuidados especiales y descripcion general.
- Debe mostrar si el animal esta vacunado, esterilizado o apto para adopcion.
- Debe permitir iniciar solicitud de adopcion.
- No debe permitir editar informacion.
- No debe mostrar datos internos del refugio.

### 6.11 Solicitud de adopcion

- Debe registrar nombre completo del solicitante.
- Debe registrar documento de identidad.
- Debe registrar telefono, correo y direccion.
- Debe registrar experiencia previa con mascotas.
- Debe registrar tipo de vivienda.
- Debe registrar motivo de adopcion.
- Debe asociar la solicitud al animal seleccionado.
- Debe guardar la solicitud con estado pendiente.
- Debe validar campos obligatorios.
- Debe mostrar confirmacion despues del envio.

### 6.12 Gestion de adoptantes

- Debe listar adoptantes registrados.
- Debe permitir busqueda por nombre, documento o correo.
- Debe permitir consultar solicitudes asociadas.
- Debe permitir editar datos de contacto.
- Debe mostrar animales adoptados por cada persona.
- Debe permitir registrar observaciones de seguimiento.

### 6.13 Gestion de usuarios

- Debe estar disponible solo para administradores.
- Debe permitir crear usuarios internos.
- Debe permitir editar usuarios.
- Debe permitir desactivar usuarios.
- Debe permitir asignar rol: administrador, voluntario o veterinario.
- Debe validar que el correo sea unico.
- Debe permitir restablecer contrasena.
- Debe impedir que usuarios no autorizados administren cuentas.

### 6.14 Reportes

- Debe generar reporte de animales registrados.
- Debe generar reporte de animales disponibles para adopcion.
- Debe generar reporte de animales adoptados.
- Debe generar reporte de adopciones por periodo.
- Debe generar reporte de inventario critico.
- Debe generar reporte de historial medico basico.
- Debe permitir filtrar reportes por fechas.
- Debe permitir visualizar reportes dentro del sistema.
- La exportacion a PDF o Excel puede quedar como mejora posterior si el alcance del prototipo es limitado.

## 7. Requerimientos no funcionales

| ID | Categoria | Requerimiento |
| --- | --- | --- |
| RNF-01 | Seguridad | Las contrasenas deben almacenarse mediante hash y nunca en texto plano. |
| RNF-02 | Seguridad | El sistema debe cerrar la sesion despues de 30 minutos de inactividad. |
| RNF-03 | Seguridad | El backend debe validar permisos antes de ejecutar operaciones protegidas. |
| RNF-04 | Seguridad | El sistema debe validar datos en frontend y backend. |
| RNF-05 | Rendimiento | Las consultas normales no deben tardar mas de 2 segundos bajo condiciones normales. |
| RNF-06 | Rendimiento | El prototipo debe soportar al menos 10 usuarios concurrentes. |
| RNF-07 | Usabilidad | Un usuario nuevo debe poder registrar un animal basico en menos de 10 minutos tras una induccion breve. |
| RNF-08 | Usabilidad | La interfaz debe ser clara, consistente y orientada a tareas. |
| RNF-09 | Compatibilidad | El sistema debe funcionar en versiones recientes de Chrome, Edge y Firefox. |
| RNF-10 | Portabilidad | El sistema debe poder ejecutarse en Windows, Linux o macOS. |
| RNF-11 | Disponibilidad | Los datos deben persistir en SQLite inmediatamente despues de guardar operaciones criticas. |
| RNF-12 | Fiabilidad | El sistema debe capturar errores y mostrar mensajes amigables sin exponer codigo interno. |
| RNF-13 | Mantenibilidad | El codigo debe estar organizado, documentado y separado por modulos. |
| RNF-14 | Responsividad | La interfaz debe adaptarse a computador, tablet y celular. |

## 8. Restricciones del proyecto

- El backend debe desarrollarse en Python.
- El prototipo puede usar Flask como framework web.
- La base de datos inicial puede ser SQLite.
- El frontend debe usar HTML5, CSS3 y JavaScript.
- Se deben usar herramientas de codigo abierto.
- El sistema debe ejecutarse como aplicacion web, no como archivo ejecutable de escritorio.
- No se incluiran pasarelas de pago en esta version.
- No se incluira geolocalizacion GPS en tiempo real.
- No se automatizaran publicaciones en redes sociales en esta version.
- Las notificaciones automaticas por correo o WhatsApp quedan como mejora futura.

## 9. Entidades principales sugeridas

- Usuario
- Rol
- Animal
- HistorialMedico
- Vacuna
- Tratamiento
- Suministro
- MovimientoInventario
- Adoptante
- SolicitudAdopcion
- Adopcion
- Reporte

## 10. Estados recomendados

### Estado del animal

- Ingresado
- En observacion
- En tratamiento
- Disponible
- En proceso de adopcion
- Adoptado
- Fallecido
- Perdido

### Estado de solicitud de adopcion

- Pendiente
- En revision
- Aprobada
- Rechazada
- Cancelada
- Formalizada

### Estado de salud

- Saludable
- En tratamiento
- En recuperacion
- Critico
- No apto para adopcion
- Apto para adopcion

## 11. Funciones clave del apartado de adopcion

El apartado de adopcion debe dividirse en dos partes:

### Parte publica

- Catalogo de animales disponibles.
- Filtros de busqueda.
- Detalle del animal.
- Formulario de solicitud de adopcion.
- Confirmacion de solicitud enviada.

### Parte administrativa

- Revision de solicitudes.
- Consulta de datos del solicitante.
- Aprobacion o rechazo.
- Formalizacion de adopcion.
- Cambio automatico del estado del animal.
- Seguimiento post-adopcion.

## 12. Alcance recomendado para el prototipo

Para una primera version funcional, se recomienda implementar como minimo:

- Inicio de sesion.
- Roles basicos.
- Dashboard.
- CRUD de animales.
- Expediente del animal.
- Registro medico basico.
- Inventario con stock minimo.
- Catalogo publico de animales disponibles.
- Solicitud de adopcion.
- Gestion interna de solicitudes.
- Formalizacion de adopcion.

Los reportes avanzados, exportaciones, notificaciones automaticas y pasarela de pagos pueden dejarse para una segunda version.
