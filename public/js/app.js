const CLAVE_TOKEN = 'controlHogarToken';

const estado = {
  token: localStorage.getItem(CLAVE_TOKEN),
  usuario: null,
  socket: null,
  dispositivos: [],
  dispositivosAdmin: [],
  usuarios: [],
  hogar: null,
  lecturas: new Map(),
  puedeGestionarRoles: false
};

const dom = {
  autenticacion: document.querySelector('#autenticacion'),
  aplicacion: document.querySelector('#aplicacion'),
  tabLogin: document.querySelector('#tab-login'),
  tabRegistro: document.querySelector('#tab-registro'),
  formLogin: document.querySelector('#form-login'),
  formRegistro: document.querySelector('#form-registro'),
  mensajeAuth: document.querySelector('#mensaje-auth'),
  mensajeApp: document.querySelector('#mensaje-app'),
  resumenSesion: document.querySelector('#resumen-sesion'),
  estadoConexion: document.querySelector('#estado-conexion'),
  navDashboard: document.querySelector('#nav-dashboard'),
  navAdmin: document.querySelector('#nav-admin'),
  botonSalir: document.querySelector('#boton-salir'),
  vistaDashboard: document.querySelector('#vista-dashboard'),
  vistaAdmin: document.querySelector('#vista-admin'),
  listaDispositivos: document.querySelector('#lista-dispositivos'),
  codigoHogar: document.querySelector('#codigo-hogar'),
  formDispositivo: document.querySelector('#form-dispositivo'),
  adminDispositivos: document.querySelector('#admin-dispositivos'),
  adminUsuarios: document.querySelector('#admin-usuarios'),
  selectorUsuarioPermisos: document.querySelector('#selector-usuario-permisos'),
  tablaPermisos: document.querySelector('#tabla-permisos')
};

dom.tabLogin.addEventListener('click', () => cambiarFormularioAuth('login'));
dom.tabRegistro.addEventListener('click', () => cambiarFormularioAuth('registro'));
dom.formLogin.addEventListener('submit', iniciarSesion);
dom.formRegistro.addEventListener('submit', registrarUsuario);
dom.botonSalir.addEventListener('click', cerrarSesion);
dom.navDashboard.addEventListener('click', () => mostrarVista('dashboard'));
dom.navAdmin.addEventListener('click', () => mostrarVista('admin'));
dom.listaDispositivos.addEventListener('click', manejarClickDispositivo);
dom.listaDispositivos.addEventListener('change', manejarCambioDispositivo);
dom.formDispositivo.addEventListener('submit', crearDispositivo);
dom.adminDispositivos.addEventListener('click', manejarClickAdminDispositivo);
dom.adminUsuarios.addEventListener('click', manejarClickAdminUsuario);
dom.selectorUsuarioPermisos.addEventListener('change', () => cargarPermisosUsuario(dom.selectorUsuarioPermisos.value));
dom.tablaPermisos.addEventListener('change', manejarCambioPermiso);

if (estado.token) {
  restaurarSesion();
}

function cambiarFormularioAuth(tipo) {
  const esLogin = tipo === 'login';
  dom.tabLogin.classList.toggle('activo', esLogin);
  dom.tabRegistro.classList.toggle('activo', !esLogin);
  dom.formLogin.classList.toggle('oculto', !esLogin);
  dom.formRegistro.classList.toggle('oculto', esLogin);
  limpiarMensaje(dom.mensajeAuth);
}

async function iniciarSesion(evento) {
  evento.preventDefault();
  limpiarMensaje(dom.mensajeAuth);

  try {
    const datos = await api('/api/auth/login', {
      method: 'POST',
      body: {
        correo: document.querySelector('#login-correo').value,
        contrasena: document.querySelector('#login-contrasena').value
      },
      sinToken: true
    });

    await entrarConSesion(datos.token, datos.usuario);
  } catch (error) {
    mostrarMensaje(dom.mensajeAuth, error.message);
  }
}

async function registrarUsuario(evento) {
  evento.preventDefault();
  limpiarMensaje(dom.mensajeAuth);

  try {
    const datos = await api('/api/auth/registro', {
      method: 'POST',
      body: {
        correo: document.querySelector('#registro-correo').value,
        contrasena: document.querySelector('#registro-contrasena').value,
        codigoHogar: document.querySelector('#registro-codigo').value
      },
      sinToken: true
    });

    await entrarConSesion(datos.token, datos.usuario);
  } catch (error) {
    mostrarMensaje(dom.mensajeAuth, error.message);
  }
}

async function restaurarSesion() {
  try {
    const datos = await api('/api/auth/perfil');
    await entrarConSesion(estado.token, datos.usuario);
  } catch {
    cerrarSesion();
  }
}

async function entrarConSesion(token, usuario) {
  estado.token = token;
  estado.usuario = usuario;
  localStorage.setItem(CLAVE_TOKEN, token);

  dom.autenticacion.classList.add('oculto');
  dom.aplicacion.classList.remove('oculto');

  prepararInterfazSesion();
  conectarSocket();
  await cargarDispositivos();

  if (usuarioEsAdmin()) {
    await cargarAdmin();
  }
}

function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  estado.token = null;
  estado.usuario = null;
  estado.dispositivos = [];
  estado.lecturas.clear();

  if (estado.socket) {
    estado.socket.disconnect();
    estado.socket = null;
  }

  dom.aplicacion.classList.add('oculto');
  dom.autenticacion.classList.remove('oculto');
  limpiarMensaje(dom.mensajeApp);
  limpiarMensaje(dom.mensajeAuth);
}

function prepararInterfazSesion() {
  const rol = etiquetaRol(estado.usuario.rol);
  dom.resumenSesion.textContent = `${estado.usuario.correo} · ${rol}`;
  dom.navAdmin.classList.toggle('oculto', !usuarioEsAdmin());

  if (!usuarioEsAdmin()) {
    mostrarVista('dashboard');
  }
}

function mostrarVista(vista) {
  const esAdmin = vista === 'admin';
  dom.vistaDashboard.classList.toggle('oculto', esAdmin);
  dom.vistaAdmin.classList.toggle('oculto', !esAdmin);
  dom.navDashboard.classList.toggle('activo', !esAdmin);
  dom.navAdmin.classList.toggle('activo', esAdmin);

  if (esAdmin && usuarioEsAdmin()) {
    cargarAdmin();
  }
}

async function cargarDispositivos() {
  const datos = await api('/api/dispositivos');
  estado.dispositivos = datos.dispositivos;
  await cargarLecturasSensores();
  renderizarDashboard();
}

async function cargarLecturasSensores() {
  const sensores = estado.dispositivos.filter((dispositivo) => dispositivo.categoria === 'sensor');
  await Promise.all(
    sensores.map(async (sensor) => {
      const datos = await api(`/api/dispositivos/${sensor.id}/lecturas?limite=30`);
      estado.lecturas.set(sensor.id, datos.lecturas);
    })
  );
}

function renderizarDashboard() {
  if (estado.dispositivos.length === 0) {
    dom.listaDispositivos.innerHTML = '<div class="vacio">No hay dispositivos asignados para este usuario.</div>';
    return;
  }

  dom.listaDispositivos.innerHTML = estado.dispositivos.map(renderizarTarjetaDispositivo).join('');
  requestAnimationFrame(dibujarGraficasTemperatura);
}

function renderizarTarjetaDispositivo(dispositivo) {
  const etiqueta = dispositivo.categoria === 'sensor' ? 'Sensor' : 'Actuador';

  return `
    <article class="tarjeta-dispositivo">
      <div class="cabecera-dispositivo">
        <div>
          <h3>${escapar(dispositivo.nombre)}</h3>
          <p>${escapar(dispositivo.ubicacion)} · ${etiquetaTipo(dispositivo.tipo)}</p>
        </div>
        <span class="etiqueta">${etiqueta}</span>
      </div>
      ${dispositivo.categoria === 'sensor' ? renderizarSensor(dispositivo) : renderizarActuador(dispositivo)}
    </article>
  `;
}

function renderizarSensor(dispositivo) {
  if (dispositivo.tipo === 'temperatura') {
    const valor = dispositivo.lecturaActual?.valor ?? '--';
    const unidad = dispositivo.lecturaActual?.unidad || dispositivo.unidad || 'C';
    return `
      <div>
        <div class="lectura-principal">
          <span>${escapar(valor)}</span>
          <small>${escapar(unidad)}</small>
        </div>
        <p class="detalle-secundario">Última lectura simulada</p>
      </div>
      <canvas class="grafica-temperatura" data-grafica="${dispositivo.id}" aria-label="Histórico de temperatura"></canvas>
    `;
  }

  const activo = Boolean(dispositivo.lecturaActual?.movimiento);
  return `
    <div>
      <span class="estado-movimiento ${activo ? 'activo' : ''}">
        ${activo ? 'Movimiento detectado' : 'Inactivo'}
      </span>
      <p class="detalle-secundario">Sensor simulado de presencia</p>
    </div>
  `;
}

function renderizarActuador(dispositivo) {
  const encendido = Boolean(dispositivo.estado?.encendido);
  const puedeControlar = Boolean(dispositivo.permiso?.puedeControlar);
  const intensidad = Number(dispositivo.estado?.intensidad ?? 40);

  return `
    <div class="fila-control">
      <div>
        <strong>${encendido ? 'Activo' : 'Apagado'}</strong>
        <p class="detalle-secundario">Estado actual</p>
      </div>
      <button
        class="boton-estado ${encendido ? 'encendido' : ''}"
        data-accion="encendido"
        data-id="${dispositivo.id}"
        data-valor="${!encendido}"
        ${puedeControlar ? '' : 'disabled'}
        type="button"
      >
        ${encendido ? 'Encendido' : 'Apagado'}
      </button>
    </div>
    ${
      dispositivo.tipo === 'ventilador'
        ? `
          <label class="control-rango">
            Intensidad: ${intensidad}%
            <input
              type="range"
              min="0"
              max="100"
              value="${intensidad}"
              data-accion="intensidad"
              data-id="${dispositivo.id}"
              ${puedeControlar ? '' : 'disabled'}
            />
          </label>
        `
        : ''
    }
  `;
}

async function manejarClickDispositivo(evento) {
  const boton = evento.target.closest('[data-accion="encendido"]');
  if (!boton) return;

  await cambiarEstadoDispositivo(boton.dataset.id, {
    encendido: boton.dataset.valor === 'true'
  });
}

async function manejarCambioDispositivo(evento) {
  if (evento.target.dataset.accion !== 'intensidad') return;

  await cambiarEstadoDispositivo(evento.target.dataset.id, {
    intensidad: Number(evento.target.value)
  });
}

async function cambiarEstadoDispositivo(id, estadoNuevo) {
  try {
    const datos = await api(`/api/dispositivos/${id}/estado`, {
      method: 'PUT',
      body: { estado: estadoNuevo }
    });

    actualizarDispositivoLocal(datos.dispositivo);
    renderizarDashboard();
  } catch (error) {
    mostrarMensaje(dom.mensajeApp, error.message);
  }
}

async function cargarAdmin() {
  if (!usuarioEsAdmin()) return;

  const [hogar, usuarios, dispositivos] = await Promise.all([
    api('/api/admin/hogar'),
    api('/api/admin/usuarios'),
    api('/api/admin/dispositivos')
  ]);

  estado.hogar = hogar.hogar;
  estado.usuarios = usuarios.usuarios;
  estado.puedeGestionarRoles = usuarios.puedeGestionarRoles;
  estado.dispositivosAdmin = dispositivos.dispositivos;

  renderizarAdmin();
}

function renderizarAdmin() {
  dom.codigoHogar.textContent = estado.hogar?.codigo || '...';
  renderizarAdminDispositivos();
  renderizarAdminUsuarios();
  renderizarSelectorPermisos();
}

function renderizarAdminDispositivos() {
  if (estado.dispositivosAdmin.length === 0) {
    dom.adminDispositivos.innerHTML = '<div class="vacio">No hay dispositivos registrados.</div>';
    return;
  }

  dom.adminDispositivos.innerHTML = estado.dispositivosAdmin
    .map(
      (dispositivo) => `
        <div class="fila-admin">
          <div>
            <strong>${escapar(dispositivo.nombre)}</strong>
            <span class="detalle-secundario">${etiquetaTipo(dispositivo.tipo)} · ${escapar(dispositivo.ubicacion)}</span>
          </div>
          <div class="acciones-fila">
            <button class="boton-mini peligro" data-admin-accion="eliminar-dispositivo" data-id="${dispositivo.id}" type="button">
              Eliminar
            </button>
          </div>
        </div>
      `
    )
    .join('');
}

function renderizarAdminUsuarios() {
  dom.adminUsuarios.innerHTML = estado.usuarios
    .map((usuario) => {
      const puedeCambiar = estado.puedeGestionarRoles && usuario.rol !== 'superadmin';
      const accion = usuario.rol === 'admin' ? 'revocar-admin' : 'hacer-admin';
      const texto = usuario.rol === 'admin' ? 'Revocar admin' : 'Hacer admin';

      return `
        <div class="fila-admin">
          <div>
            <strong>${escapar(usuario.correo)}</strong>
            <span class="detalle-secundario">${etiquetaRol(usuario.rol)}</span>
          </div>
          <div class="acciones-fila">
            ${
              puedeCambiar
                ? `<button class="boton-mini" data-usuario-accion="${accion}" data-id="${usuario.id}" type="button">${texto}</button>`
                : ''
            }
          </div>
        </div>
      `;
    })
    .join('');
}

function renderizarSelectorPermisos() {
  const usuariosComunes = estado.usuarios.filter((usuario) => usuario.rol === 'usuario');

  if (usuariosComunes.length === 0) {
    dom.selectorUsuarioPermisos.innerHTML = '';
    dom.tablaPermisos.innerHTML = '<div class="vacio">No hay usuarios comunes para asignar permisos.</div>';
    return;
  }

  const valorActual = dom.selectorUsuarioPermisos.value;
  dom.selectorUsuarioPermisos.innerHTML = usuariosComunes
    .map((usuario) => `<option value="${usuario.id}">${escapar(usuario.correo)}</option>`)
    .join('');

  if (usuariosComunes.some((usuario) => usuario.id === valorActual)) {
    dom.selectorUsuarioPermisos.value = valorActual;
  }

  cargarPermisosUsuario(dom.selectorUsuarioPermisos.value);
}

async function cargarPermisosUsuario(usuarioId) {
  if (!usuarioId) return;

  try {
    const datos = await api(`/api/admin/permisos/${usuarioId}`);
    renderizarPermisos(datos.usuario, datos.permisos);
  } catch (error) {
    mostrarMensaje(dom.mensajeApp, error.message);
  }
}

function renderizarPermisos(usuario, permisos) {
  dom.tablaPermisos.innerHTML = permisos
    .map(({ dispositivo, puedeVer, puedeControlar }) => {
      const esSensor = dispositivo.categoria === 'sensor';
      return `
        <div class="fila-permiso" data-usuario="${usuario.id}" data-dispositivo="${dispositivo.id}">
          <div>
            <strong>${escapar(dispositivo.nombre)}</strong>
            <span class="detalle-secundario">${etiquetaTipo(dispositivo.tipo)} · ${escapar(dispositivo.ubicacion)}</span>
          </div>
          <div class="opciones-permiso">
            <label>
              <input type="checkbox" data-permiso="ver" ${puedeVer ? 'checked' : ''} />
              Ver
            </label>
            <label>
              <input type="checkbox" data-permiso="controlar" ${puedeControlar ? 'checked' : ''} ${esSensor ? 'disabled' : ''} />
              Controlar
            </label>
          </div>
        </div>
      `;
    })
    .join('');
}

async function crearDispositivo(evento) {
  evento.preventDefault();

  try {
    await api('/api/admin/dispositivos', {
      method: 'POST',
      body: {
        nombre: document.querySelector('#dispositivo-nombre').value,
        tipo: document.querySelector('#dispositivo-tipo').value,
        ubicacion: document.querySelector('#dispositivo-ubicacion').value
      }
    });

    dom.formDispositivo.reset();
    await Promise.all([cargarAdmin(), cargarDispositivos()]);
    mostrarMensaje(dom.mensajeApp, 'Dispositivo agregado.', true);
  } catch (error) {
    mostrarMensaje(dom.mensajeApp, error.message);
  }
}

async function manejarClickAdminDispositivo(evento) {
  const boton = evento.target.closest('[data-admin-accion="eliminar-dispositivo"]');
  if (!boton) return;

  try {
    await api(`/api/admin/dispositivos/${boton.dataset.id}`, { method: 'DELETE' });
    await Promise.all([cargarAdmin(), cargarDispositivos()]);
    mostrarMensaje(dom.mensajeApp, 'Dispositivo eliminado.', true);
  } catch (error) {
    mostrarMensaje(dom.mensajeApp, error.message);
  }
}

async function manejarClickAdminUsuario(evento) {
  const boton = evento.target.closest('[data-usuario-accion]');
  if (!boton) return;

  const rol = boton.dataset.usuarioAccion === 'hacer-admin' ? 'admin' : 'usuario';

  try {
    await api(`/api/admin/usuarios/${boton.dataset.id}/rol`, {
      method: 'PATCH',
      body: { rol }
    });

    await cargarAdmin();
    mostrarMensaje(dom.mensajeApp, 'Rol actualizado.', true);
  } catch (error) {
    mostrarMensaje(dom.mensajeApp, error.message);
  }
}

async function manejarCambioPermiso(evento) {
  const fila = evento.target.closest('.fila-permiso');
  if (!fila) return;

  const ver = fila.querySelector('[data-permiso="ver"]');
  const controlar = fila.querySelector('[data-permiso="controlar"]');

  try {
    await api('/api/admin/permisos', {
      method: 'PATCH',
      body: {
        usuarioId: fila.dataset.usuario,
        dispositivoId: fila.dataset.dispositivo,
        puedeVer: ver.checked,
        puedeControlar: controlar?.checked || false
      }
    });

    await cargarPermisosUsuario(fila.dataset.usuario);
    mostrarMensaje(dom.mensajeApp, 'Permiso actualizado.', true);
  } catch (error) {
    mostrarMensaje(dom.mensajeApp, error.message);
    await cargarPermisosUsuario(fila.dataset.usuario);
  }
}

function conectarSocket() {
  if (estado.socket) {
    estado.socket.disconnect();
  }

  estado.socket = io({
    auth: {
      token: estado.token
    }
  });

  estado.socket.on('connect', () => {
    dom.estadoConexion.textContent = 'En vivo';
    dom.estadoConexion.style.color = 'var(--verde-fuerte)';
  });

  estado.socket.on('disconnect', () => {
    dom.estadoConexion.textContent = 'Sin conexión';
    dom.estadoConexion.style.color = 'var(--rojo)';
  });

  estado.socket.on('connect_error', () => {
    dom.estadoConexion.textContent = 'Socket no autorizado';
    dom.estadoConexion.style.color = 'var(--rojo)';
  });

  estado.socket.on('dispositivo:actualizado', ({ dispositivo }) => {
    actualizarDispositivoLocal(dispositivo);
    renderizarDashboard();
  });

  estado.socket.on('lectura:sensor', ({ dispositivo, lectura }) => {
    actualizarDispositivoLocal(dispositivo);
    agregarLecturaLocal(dispositivo.id, lectura);
    renderizarDashboard();
  });

  estado.socket.on('permisos:actualizados', async () => {
    await cargarDispositivos();
    mostrarMensaje(dom.mensajeApp, 'Tus permisos fueron actualizados.', true);
  });

  estado.socket.on('dispositivo:eliminado', ({ id }) => {
    estado.dispositivos = estado.dispositivos.filter((dispositivo) => dispositivo.id !== id);
    estado.dispositivosAdmin = estado.dispositivosAdmin.filter((dispositivo) => dispositivo.id !== id);
    estado.lecturas.delete(id);
    renderizarDashboard();
    if (usuarioEsAdmin()) renderizarAdmin();
  });

  estado.socket.on('admin:actualizado', async () => {
    if (usuarioEsAdmin()) await cargarAdmin();
  });

  estado.socket.on('sesion:actualizar', sincronizarPerfil);
}

async function sincronizarPerfil() {
  try {
    const rolAnterior = estado.usuario?.rol;
    const datos = await api('/api/auth/perfil');
    estado.usuario = datos.usuario;
    prepararInterfazSesion();

    if (rolAnterior !== estado.usuario.rol) {
      conectarSocket();
    }

    await cargarDispositivos();
    if (usuarioEsAdmin()) await cargarAdmin();
  } catch {
    cerrarSesion();
  }
}

function actualizarDispositivoLocal(dispositivoActualizado) {
  estado.dispositivos = reemplazarPorId(estado.dispositivos, dispositivoActualizado);
  estado.dispositivosAdmin = reemplazarPorId(estado.dispositivosAdmin, dispositivoActualizado);
}

function agregarLecturaLocal(dispositivoId, lectura) {
  const lecturas = estado.lecturas.get(dispositivoId) || [];
  lecturas.push(lectura);
  estado.lecturas.set(dispositivoId, lecturas.slice(-30));
}

function reemplazarPorId(lista, elemento) {
  const indice = lista.findIndex((actual) => actual.id === elemento.id);
  if (indice === -1) return [...lista, elemento];

  const copia = [...lista];
  copia[indice] = elemento;
  return copia;
}

function dibujarGraficasTemperatura() {
  const lienzos = document.querySelectorAll('[data-grafica]');

  lienzos.forEach((lienzo) => {
    const lecturas = estado.lecturas.get(lienzo.dataset.grafica) || [];
    const puntos = lecturas.map((lectura) => Number(lectura.valor?.valor)).filter(Number.isFinite);
    dibujarLinea(lienzo, puntos);
  });
}

function dibujarLinea(lienzo, puntos) {
  const escala = window.devicePixelRatio || 1;
  const ancho = lienzo.clientWidth || 260;
  const alto = lienzo.clientHeight || 86;
  lienzo.width = ancho * escala;
  lienzo.height = alto * escala;

  const contexto = lienzo.getContext('2d');
  contexto.scale(escala, escala);
  contexto.clearRect(0, 0, ancho, alto);
  contexto.strokeStyle = '#d8ded5';
  contexto.lineWidth = 1;
  contexto.beginPath();
  contexto.moveTo(0, alto - 12);
  contexto.lineTo(ancho, alto - 12);
  contexto.stroke();

  if (puntos.length < 2) return;

  const minimo = Math.min(...puntos) - 1;
  const maximo = Math.max(...puntos) + 1;
  const rango = Math.max(maximo - minimo, 1);

  contexto.strokeStyle = '#1f8a70';
  contexto.lineWidth = 3;
  contexto.beginPath();

  puntos.forEach((punto, indice) => {
    const x = (indice / (puntos.length - 1)) * ancho;
    const y = alto - 14 - ((punto - minimo) / rango) * (alto - 28);
    if (indice === 0) contexto.moveTo(x, y);
    else contexto.lineTo(x, y);
  });

  contexto.stroke();
}

async function api(ruta, opciones = {}) {
  const encabezados = {
    'Content-Type': 'application/json',
    ...(opciones.headers || {})
  };

  if (estado.token && !opciones.sinToken) {
    encabezados.Authorization = `Bearer ${estado.token}`;
  }

  const respuesta = await fetch(ruta, {
    method: opciones.method || 'GET',
    headers: encabezados,
    body: opciones.body ? JSON.stringify(opciones.body) : undefined
  });

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : {};

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'La solicitud no pudo completarse.');
  }

  return datos;
}

function usuarioEsAdmin() {
  return estado.usuario?.rol === 'admin' || estado.usuario?.rol === 'superadmin';
}

function etiquetaRol(rol) {
  const etiquetas = {
    usuario: 'Usuario',
    admin: 'Administrador',
    superadmin: 'Superadmin'
  };

  return etiquetas[rol] || rol;
}

function etiquetaTipo(tipo) {
  const etiquetas = {
    luz: 'Luz',
    ventilador: 'Ventilador',
    temperatura: 'Temperatura',
    movimiento: 'Movimiento',
    otro: 'Otro'
  };

  return etiquetas[tipo] || tipo;
}

function mostrarMensaje(elemento, texto, exito = false) {
  elemento.textContent = texto;
  elemento.classList.toggle('exito', exito);

  if (texto) {
    window.setTimeout(() => limpiarMensaje(elemento), 3600);
  }
}

function limpiarMensaje(elemento) {
  elemento.textContent = '';
  elemento.classList.remove('exito');
}

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (caracter) => {
    const mapa = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return mapa[caracter];
  });
}
