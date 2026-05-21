# Manual de usuario

Este manual describe las funciones que existen actualmente en el sistema **Control Hogar**.

El sistema es una simulación de hogar inteligente. No se conecta con hardware real. Los sensores y actuadores son representaciones de software.

## 1. Tipos de usuario

El sistema maneja tres roles:

- **Usuario común**: puede ver y controlar únicamente los dispositivos que le fueron asignados.
- **Administrador**: puede ver todos los dispositivos, controlar actuadores, agregar o eliminar dispositivos y asignar permisos a usuarios comunes.
- **Superadministrador**: tiene todos los permisos de administrador y además puede convertir usuarios comunes en administradores o revocar ese rol.

El sistema maneja un solo hogar.

## 2. Cuenta inicial

Al iniciar el sistema por primera vez, se crea automáticamente esta cuenta:

```txt
Correo: admin@hogar.com
Contraseña: admin123
```

Esta cuenta es el superadministrador inicial.

## 3. Iniciar sesión

1. Abre la aplicación en el navegador.
2. Entra a la pestaña **Iniciar sesión**.
3. Escribe tu correo.
4. Escribe tu contraseña.
5. Presiona **Entrar**.

Si las credenciales son correctas, entrarás al dashboard.

## 4. Registrarse como usuario común

1. Abre la aplicación en el navegador.
2. Entra a la pestaña **Registro**.
3. Escribe tu correo.
4. Escribe una contraseña de al menos 6 caracteres.
5. Escribe el código del hogar.
6. Presiona **Crear cuenta**.

El código del hogar lo puede consultar un administrador desde la vista administrativa.

Los usuarios registrados por sí mismos entran como usuarios comunes. No se vuelven administradores automáticamente.

## 5. Dashboard

El dashboard muestra los dispositivos disponibles para el usuario actual.

Un usuario común solo ve los dispositivos para los que tiene permiso de visualización.

Un administrador y el superadministrador ven todos los dispositivos del hogar.

## 6. Controlar luces

Las luces son actuadores simulados.

Si el usuario tiene permiso de control, puede:

- Encender una luz.
- Apagar una luz.
- Ver el estado actual de la luz.

Si el usuario no tiene permiso de control, el botón aparece deshabilitado.

## 7. Controlar ventilador

El ventilador es un actuador simulado.

Si el usuario tiene permiso de control, puede:

- Encender el ventilador.
- Apagar el ventilador.
- Cambiar la intensidad con un control deslizante.

La intensidad se maneja de 0 a 100.

## 8. Ver sensor de temperatura

El sensor de temperatura es simulado.

El sistema genera lecturas automáticamente cada cierto intervalo. En el dashboard se muestra:

- Temperatura actual.
- Unidad en grados Celsius.
- Gráfica simple con lecturas recientes.

Si el usuario no tiene permiso de visualización para ese sensor, no lo verá.

## 9. Ver sensor de movimiento

El sensor de movimiento es simulado.

El sistema alterna automáticamente entre estados como:

- Inactivo.
- Movimiento detectado.

Si el usuario no tiene permiso de visualización para ese sensor, no lo verá.

## 10. Actualizaciones en tiempo real

La aplicación recibe actualizaciones en vivo mientras está abierta.

Esto aplica para:

- Cambios de estado de actuadores.
- Nuevas lecturas de sensores.
- Cambios de permisos.
- Eliminación de dispositivos.

Si otro usuario con permisos cambia un dispositivo, el cambio puede reflejarse en el dashboard sin recargar manualmente la página.

## 11. Vista administrativa

La vista **Administración** solo aparece para administradores y superadministradores.

Desde esta vista se puede:

- Ver el código del hogar.
- Ver usuarios registrados.
- Ver dispositivos existentes.
- Agregar dispositivos.
- Eliminar dispositivos.
- Asignar permisos a usuarios comunes.
- Revocar permisos a usuarios comunes.

## 12. Ver código del hogar

El código del hogar aparece en la parte superior de la vista administrativa.

Ese código sirve para que nuevos usuarios puedan registrarse.

## 13. Agregar dispositivos

En la vista administrativa se puede agregar un dispositivo indicando:

- Nombre.
- Tipo.
- Ubicación.

Tipos disponibles actualmente:

- Luz.
- Ventilador.
- Sensor de temperatura.
- Sensor de movimiento.

Los sensores agregados empiezan a generar datos simulados automáticamente.

## 14. Eliminar dispositivos

En la vista administrativa se puede eliminar un dispositivo.

Al eliminarlo:

- Desaparece del dashboard.
- Se eliminan sus permisos asociados.
- Se eliminan sus lecturas históricas guardadas.

Esta acción no pide confirmación adicional en la versión actual.

## 15. Gestionar usuarios

La vista administrativa muestra los usuarios registrados.

Los administradores pueden ver la lista de usuarios, pero solo el superadministrador puede cambiar roles.

## 16. Promover o revocar administradores

El superadministrador puede:

- Convertir un usuario común en administrador.
- Revocar el rol de administrador y volverlo usuario común.

El superadministrador principal no puede perder su rol desde la interfaz.

## 17. Asignar permisos

Los administradores pueden asignar permisos a usuarios comunes.

Para actuadores, como luces y ventilador, se manejan estos permisos:

- **Ver**: permite que el dispositivo aparezca en el dashboard.
- **Controlar**: permite cambiar su estado.

Para sensores, como temperatura y movimiento, se maneja principalmente:

- **Ver**: permite consultar sus datos.

El permiso de control no aplica para sensores.

## 18. Cerrar sesión

Para salir del sistema:

1. Presiona **Salir** en la parte superior.
2. La aplicación volverá a la pantalla de login.

## 19. Funciones que no existen actualmente

Para evitar confusiones, estas funciones no están implementadas en la versión actual:

- Recuperación de contraseña.
- Cambio de contraseña desde la interfaz.
- Edición de nombre o ubicación de dispositivos existentes.
- Edición del código del hogar desde la interfaz.
- Eliminación de usuarios.
- Soporte para varios hogares.
- Conexión con sensores o actuadores físicos reales.
- Exportación de lecturas históricas.
- Panel gráfico avanzado de estadísticas.
