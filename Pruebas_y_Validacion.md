# Pruebas y Validación del Sistema: CoSpace

A continuación se detallan los enunciados de las pruebas fundamentales y de validación funcional estructuradas por módulos para garantizar el correcto funcionamiento de la plataforma CoSpace. Se pueden adjuntar a la memoria del proyecto como los requerimientos testeados.

## 1. Pruebas de Autenticación, Autorización y Seguridad
* **PU-01: Registro de Usuarios:** Validar que un nuevo usuario puede registrarse correctamente proporcionando los datos obligatorios, y que estos se ingresen correctamente en la base de datos con contraseñas encriptadas.
* **PU-02: Inicio de Sesión:** Validar que un usuario registrado puede iniciar sesión con credenciales válidas y que el sistema bloquea el acceso con contraseñas incorrectas o correos inexistentes.
* **PU-03: Doble Factor de Autenticación (2FA):** Validar que, durante el inicio de sesión para cuentas con 2FA habilitado, el sistema envía un código por correo electrónico (mediante API Brevo) y solo concede el acceso tras ingresar dicho código correctamente.
* **PU-04: Control de Acceso por Roles (RBAC):** Validar que los permisos, vistas y botones se restringen correctamente según el rol de la sesión iniciada (Administrador, Cliente, Anfitrión). *Por ejemplo, asegurar que solo un perfil de administración puede acceder al panel principal de "Admin".*

## 2. Pruebas de Gestión de Espacios (Rol: Anfitrión)
* **PE-01: Publicación de un Espacio:** Validar que un Anfitrión puede crear un nuevo espacio para alquilar o gestionar, ingresando correctamente los datos como título, descripción, precio por día y fotografías.
* **PE-02: Actualización/Edición de Espacio:** Validar que un Anfitrión puede modificar la información y precio (e.g. validando el cambio de precio por hora a precio por día) de uno de sus espacios y guardar los cambios exitosamente en la plataforma.
* **PE-03: Listado de "Mis Áreas":** Validar que un Anfitrión cuenta con la capacidad de previsualizar de manera estructurada cómo luce el catálogo de las propiedades que tiene listadas en el sistema.

## 3. Pruebas de Exploración, Reservas y Pagos (Rol: Cliente)
* **PR-01: Visualización del Catálogo y Detalles:** Validar que los clientes tienen acceso al flujo de listado de espacios, visualizando información básica, y pueden acceder a la página dinámica de detalles por espacio específico.
* **PR-02: Flujo de Reserva:** Validar que un cliente puede seleccionar periodos de tiempo disponibles en el calendario y concretar exitosamente la reserva del área de su preferencia.
* **PR-03: Resumen de Reservas Activas:** Validar que los clientes disponen de un panel o visualización donde comprobar el estado e historial de todas las reservas que han emitido en la aplicación.

## 4. Pruebas del Panel de Administración (Rol: Administrador)
* **PA-01: Acceso al Dashboard Central:** Validar que el menú del "Sidebar de Administración" permite una correcta navegación por las diferentes secciones de gestión: Usuarios, Espacios, Reservas, Pagos y Reportes.
* **PA-02: Gestión de Reportes del Sistema:** Validar que el Administrador puede listar los reportes enviados por los usuarios hacia diferentes espacios, consultar el motivo, cambiar el estado de resolución del reporte o eliminarlo del registro.
* **PA-03: Moderación Global de la Tabla de Espacios y Usuarios:** Validar que la tabla administrativa carga correctamente los detalles integrales de los registros provenientes de la base de datos para ejercer una correcta supervisión de la plataforma.

## 5. Pruebas de Funcionalidades Transversales (UX y Módulos)
* **PT-01: Envío de Reporte a Espacio (Front-End/Back-End):** Validar que, desde la tarjeta de un espacio o sus detalles, el usuario (cliente) logre invocar el modal interactivo de denuncias/reportes, seleccionar un motivo predeterminado y que este se registre al hacer *submit*.
* **PT-02: Sistema de Notificaciones Toast (Feedback UI):** Validar que, tras realizar cualquier acción clave (una reserva exitosa, fallo en login, alerta de error en datos), el sistema invoca de forma global notificaciones atractivas tipo "Toast" de colores en las esquinas de la vista web sin paralizar la navegación.
* **PT-03: Comunicación en Tiempo Real (Widget de Chat):** Validar la posibilidad de que dos involucrados intercambien mensajería a través del módulo widget integrado, y que los mensajes sean persistentes o legibles en su hilo correspondiente.
* **PT-04: Diseño Adaptativo y Dinámico (Responsividad de Tailwind):** Validar que la interfaz se muestre prolijamente (sin elementos desbordados) tanto en ventanas predeterminadas de pantalla de computadoras como en vistas reducidas (ej., navegadores en teléfonos celulares), asegurando también que los márgenes globales se conserven.
