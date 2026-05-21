# Guía de instalación

Esta guía explica cómo instalar y ejecutar el sistema **Control Hogar** en Windows.

El sistema necesita tres cosas principales:

- Node.js, para ejecutar el servidor.
- MongoDB Community Server, para guardar usuarios, dispositivos, permisos y lecturas.
- Un navegador web, para usar la aplicación.

No es obligatorio instalar MongoDB Compass ni MongoDB Shell. Compass sirve para ver la base de datos de forma gráfica y Shell sirve para ejecutar comandos manuales, pero el sistema funciona sin ellos.

## 1. Descargar Node.js

1. Entra al sitio oficial de Node.js: <https://nodejs.org/>.
2. Descarga la versión **LTS** recomendada para Windows.
3. Ejecuta el instalador.
4. Deja activada la opción para instalar `npm`.
5. Termina la instalación.

Para confirmar que Node.js quedó instalado:

1. Abre PowerShell.
2. Ejecuta:

```powershell
node -v
npm -v
```

Si ambos comandos muestran una versión, Node.js está instalado correctamente.

## 2. Descargar MongoDB Community Server

1. Entra al sitio oficial de MongoDB Community Server: <https://www.mongodb.com/try/download/community>.
2. Selecciona:
   - Version: MongoDB Community Server 6.x o superior.
   - Platform: Windows.
   - Package: MSI.
3. Descarga el instalador.
4. Ejecuta el archivo `.msi`.
5. Durante la instalación, selecciona **Complete**.
6. Cuando aparezca la opción de servicio, deja activado **Install MongoD as a Service**.
7. Usa la opción de ejecutar el servicio como **Network Service user**, que es la opción normal.
8. MongoDB Compass es opcional; puedes instalarlo o no.
9. Termina la instalación.

## 3. Iniciar MongoDB

Si MongoDB se instaló como servicio, normalmente se inicia solo.

Para revisarlo:

1. Presiona `Win + R`.
2. Escribe:

```txt
services.msc
```

3. Busca un servicio llamado **MongoDB**.
4. Si aparece como detenido, haz clic derecho y selecciona **Iniciar**.

También puedes intentar iniciarlo desde PowerShell como administrador:

```powershell
Start-Service MongoDB
```

Para comprobar que MongoDB está escuchando en el puerto correcto:

```powershell
Test-NetConnection 127.0.0.1 -Port 27017
```

Debe aparecer:

```txt
TcpTestSucceeded : True
```

## 4. Preparar el proyecto

Si recibiste el proyecto en un `.zip`:

1. Descomprime el archivo.
2. Entra a la carpeta del proyecto.
3. Abre PowerShell dentro de esa carpeta.

La carpeta debe contener archivos como:

```txt
package.json
src/
public/
.env.example
```

## 5. Crear el archivo `.env`

El proyecto necesita un archivo llamado `.env`.

Si no existe, copia el contenido de `.env.example` y crea un archivo nuevo llamado `.env` en la raíz del proyecto.

Contenido recomendado:

```env
PUERTO=3000
MONGODB_URI=mongodb://127.0.0.1:27017/control_hogar
JWT_SECRETO=cambia-este-secreto-en-produccion
CODIGO_HOGAR=HOGAR-UADY-2026
NOMBRE_HOGAR=Hogar principal
INTERVALO_SIMULADOR_MS=3500
```

Explicación breve:

- `PUERTO`: puerto donde se abrirá la aplicación.
- `MONGODB_URI`: dirección de MongoDB local.
- `JWT_SECRETO`: texto usado para firmar sesiones.
- `CODIGO_HOGAR`: código que los usuarios necesitan para registrarse.
- `NOMBRE_HOGAR`: nombre interno del hogar.
- `INTERVALO_SIMULADOR_MS`: tiempo entre lecturas simuladas de sensores.

## 6. Instalar dependencias del proyecto

En PowerShell, dentro de la carpeta del proyecto, ejecuta:

```powershell
npm install
```

Este comando descarga las librerías necesarias en la carpeta `node_modules`.

## 7. Ejecutar el sistema

Con MongoDB iniciado, ejecuta:

```powershell
npm start
```

Si todo está bien, verás mensajes parecidos a:

```txt
Base de datos conectada: mongodb://127.0.0.1:27017/control_hogar
Hogar listo: Hogar principal (HOGAR-UADY-2026)
Simulador IoT activo cada 3500 ms
Servidor disponible en http://localhost:3000
```

## 8. Abrir la aplicación

Abre tu navegador y entra a:

```txt
http://localhost:3000
```

## 9. Usuario administrador inicial

El sistema crea automáticamente un superadministrador:

```txt
Correo: admin@hogar.com
Contraseña: admin123
```

Con esa cuenta puedes entrar, ver todos los dispositivos, agregar dispositivos, eliminar dispositivos, asignar permisos y promover usuarios a administrador.

## 10. Problemas comunes

### Error: connect ECONNREFUSED 127.0.0.1:27017

Significa que MongoDB no está corriendo o no está escuchando en el puerto `27017`.

Solución:

1. Abre `services.msc`.
2. Busca **MongoDB**.
3. Inicia el servicio.
4. Ejecuta otra vez:

```powershell
npm start
```

### Error: npm no se reconoce como comando

Significa que Node.js no está instalado correctamente o PowerShell no detectó el PATH.

Solución:

1. Cierra PowerShell.
2. Abre PowerShell de nuevo.
3. Ejecuta:

```powershell
node -v
npm -v
```

Si sigue fallando, reinstala Node.js LTS.

### El navegador no abre la aplicación

Revisa que el servidor siga ejecutándose en PowerShell. Si cerraste la terminal, el servidor se detuvo.

Ejecuta otra vez:

```powershell
npm start
```

### Un usuario no puede registrarse

Verifica que esté usando el código correcto del hogar. El código está en el archivo `.env`, en la variable:

```env
CODIGO_HOGAR=HOGAR-UADY-2026
```
