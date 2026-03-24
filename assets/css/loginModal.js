// loginModal.js - Sistema de Login Modal Universal con Gestión de Sesión
// =====================================================================

// Configuración global
const LOGIN_MODAL_CONFIG = {
  AUTO_CHECK_INTERVAL: 30000, // Verificar cada 30 segundos si hay usuario
  REDIRECT_DELAY: 1500, // Delay antes de redireccionar después del login exitoso
  STYLES_LOADED: false,
  USER_WIDGET_CREATED: false
};

// Estado global del modal
let loginModalState = {
  isOpen: false,
  checkInterval: null,
  originalUrl: null
};

// Función para cargar los estilos CSS si no están cargados
function loadLoginModalStyles() {
  if (LOGIN_MODAL_CONFIG.STYLES_LOADED) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/css/loginModal.css';
  document.head.appendChild(link);
  
  LOGIN_MODAL_CONFIG.STYLES_LOADED = true;
}

// Función para crear el HTML del modal
function createLoginModalHTML() {
  return `
    <div id="loginModalOverlay" class="login-modal-overlay">
      <div class="login-modal-container">
        <div class="login-modal-header">
          <h2>🔐 Acceso Requerido</h2>
          <p>Debes iniciar sesión para continuar</p>
        </div>
        
        <form class="login-modal-form" id="loginModalForm">
          <div class="login-modal-field">
            <label for="loginModalUsername" class="login-modal-label">Usuario</label>
            <input 
              type="text" 
              id="loginModalUsername" 
              name="username" 
              class="login-modal-input" 
              placeholder="Ingresa tu usuario"
              required 
              autocomplete="username"
            >
          </div>
          
          <div class="login-modal-field">
            <label for="loginModalPassword" class="login-modal-label">Contraseña</label>
            <input 
              type="password" 
              id="loginModalPassword" 
              name="password" 
              class="login-modal-input" 
              placeholder="Ingresa tu contraseña"
              required 
              autocomplete="current-password"
            >
          </div>
          
          <div id="loginModalMessage" class="login-modal-message"></div>
          
          <div class="login-modal-buttons">
            <button type="submit" class="login-modal-btn-primary" id="loginModalSubmit">
              <span class="login-modal-btn-text">Iniciar Sesión</span>
              <span class="login-modal-spinner" style="display: none;">⟳</span>
            </button>
            <button type="button" class="login-modal-btn-secondary" onclick="redirectToLoginPage()">
              Ir a página de login
            </button>
          </div>
        </form>
        
        <div class="login-modal-footer">
          <small>💡 Tip: Una vez que inicies sesión, podrás continuar con tu trabajo normal</small>
        </div>
      </div>
    </div>
  `;
}

// Función para verificar si hay usuario logueado
function checkUserSession() {
  try {
    const usuarioSGA = JSON.parse(localStorage.getItem('usuarioSGA'));
    return usuarioSGA && usuarioSGA.id;
  } catch {
    return false;
  }
}

// Función para mostrar el modal de login
function showLoginModal() {
  if (loginModalState.isOpen) return;
  
  // Obtener el modal del DOM (si está incrustado en ChecklistSPA.html)
  let modal = document.getElementById('loginModalOverlay');
  
  // Si no existe en el DOM, crearlo dinámicamente (para compatibilidad con otras páginas)
  if (!modal) {
    loadLoginModalStyles();
    
    // Guardar URL original para redirección posterior
    loginModalState.originalUrl = window.location.href;
    
    // Crear y añadir el modal al DOM
    const modalHTML = createLoginModalHTML();
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
  }
  
  // Obtener referencia al modal (ahora ya existe)
  modal = document.getElementById('loginModalOverlay');
  
  // Configurar event listeners
  setupLoginModalEvents();
  
  // Mostrar modal con animación
  setTimeout(() => {
    document.getElementById('loginModalOverlay').classList.add('active');
    document.getElementById('loginModalUsername').focus();
  }, 10);
  
  loginModalState.isOpen = true;
  
  console.log('🔐 Modal de login mostrado - Usuario no autenticado');
}

// Función para ocultar el modal de login
function hideLoginModal() {
  const overlay = document.getElementById('loginModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
  loginModalState.isOpen = false;
}

// Función para configurar los eventos del modal
function setupLoginModalEvents() {
  const form = document.getElementById('loginModalForm');
  const usernameInput = document.getElementById('loginModalUsername');
  const passwordInput = document.getElementById('loginModalPassword');
  
  // Envío del formulario
  form.addEventListener('submit', handleLoginSubmit);
  
  // Enter en los campos
  usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      passwordInput.focus();
    }
  });
  
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      form.dispatchEvent(new Event('submit'));
    }
  });
  
  // Limpiar mensaje de error al escribir
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener('input', () => {
      clearLoginMessage();
      input.classList.remove('error');
    });
  });
}

// Función para manejar el envío del login
async function handleLoginSubmit(event) {
  event.preventDefault();
  
  const username = document.getElementById('loginModalUsername').value.trim();
  const password = document.getElementById('loginModalPassword').value.trim();
  const submitBtn = document.getElementById('loginModalSubmit');
  const btnText = submitBtn.querySelector('.login-modal-btn-text');
  const spinner = submitBtn.querySelector('.login-modal-spinner');
  
  if (!username || !password) {
    showLoginMessage('Por favor, complete todos los campos.', 'error');
    return;
  }
  
  // Mostrar estado de carga
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'inline';
  clearLoginMessage();
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: username, password: password })
    });
    
    if (!response.ok) {
      showLoginMessage('Usuario o contraseña incorrectos.', 'error');
      document.getElementById('loginModalUsername').classList.add('error');
      document.getElementById('loginModalPassword').classList.add('error');
      return;
    }
    
    const userData = await response.json();
    
    if (userData && userData.id) {
      // Guardar usuario en localStorage
      localStorage.setItem('usuarioSGA', JSON.stringify(userData));
      
      // Actualizar widget de usuario
      updateUserWidget();
      
      // Mostrar mensaje de éxito
      showLoginMessage(`¡Bienvenido, ${userData.nombre || userData.usuario}!`, 'success');
      
      // Ocultar modal después de un breve delay
      setTimeout(() => {
        hideLoginModal();
        
        // Emitir evento personalizado para notificar a la página
        window.dispatchEvent(new CustomEvent('userLoggedIn', { 
          detail: userData 
        }));
        
        console.log('✅ Usuario autenticado exitosamente:', userData.usuario);
        
      }, LOGIN_MODAL_CONFIG.REDIRECT_DELAY);
      
    } else {
      showLoginMessage('Error en la respuesta del servidor.', 'error');
    }
    
  } catch (error) {
    console.error('Error en login modal:', error);
    showLoginMessage('Error de conexión. Intenta nuevamente.', 'error');
  } finally {
    // Restaurar estado del botón
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}

// Función para mostrar mensajes en el modal
function showLoginMessage(message, type = 'info') {
  const messageDiv = document.getElementById('loginModalMessage');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `login-modal-message ${type}`;
    messageDiv.style.display = 'block';
  }
}

// Función para limpiar mensajes
function clearLoginMessage() {
  const messageDiv = document.getElementById('loginModalMessage');
  if (messageDiv) {
    messageDiv.style.display = 'none';
    messageDiv.textContent = '';
    messageDiv.className = 'login-modal-message';
  }
}

// Función para redireccionar a la página de inicio de PuestosCAB (solo si es necesario)
function redirectToLoginPage() {
  // Si estamos en ChecklistSPA.html, no redireccionar
  if (window.location.pathname.includes('ChecklistSPA.html')) {
    console.log('ℹ️ Ya estamos en ChecklistSPA.html - Modal local disponible');
    return;
  }
  
  // Para otras páginas, guardar la URL actual para volver después del login
  sessionStorage.setItem('redirectAfterLogin', window.location.href);
  window.location.href = '/templates/generales/PuestosCAB.html';
}

// Función para verificar automáticamente la sesión
function startSessionCheck() {
  // Detener verificación previa si existe
  if (loginModalState.checkInterval) {
    clearInterval(loginModalState.checkInterval);
  }
  
  // Verificación inicial
  if (!checkUserSession()) {
    showLoginModal();
  }
  
  // Verificación periódica
  loginModalState.checkInterval = setInterval(() => {
    if (!checkUserSession() && !loginModalState.isOpen) {
      showLoginModal();
    }
  }, LOGIN_MODAL_CONFIG.AUTO_CHECK_INTERVAL);
}

// Función para detener la verificación automática
function stopSessionCheck() {
  if (loginModalState.checkInterval) {
    clearInterval(loginModalState.checkInterval);
    loginModalState.checkInterval = null;
  }
}

// Función para verificar usuario antes de operaciones críticas
function requireUser(callback, errorMessage = 'Debes iniciar sesión para realizar esta acción.') {
  if (checkUserSession()) {
    return callback();
  } else {
    showLoginModal();
    // Opcional: mostrar mensaje específico
    setTimeout(() => {
      showLoginMessage(errorMessage, 'warning');
    }, 500);
    return false;
  }
}

// Función para obtener el usuario actual
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('usuarioSGA'));
  } catch {
    return null;
  }
}

// Función para cerrar sesión
function logoutUser() {
  try {
    // Best-effort para cerrar sesión server-side
    fetch('/api/logout', { method: 'POST' }).catch(() => {});

    // Limpiar localStorage
    localStorage.removeItem('usuarioSGA');
    
    // Detener verificación automática
    stopSessionCheck();
    
    // Actualizar widget de usuario si existe
    updateUserWidget();
    
    // Recargar para forzar estado no autenticado y reapertura del modal
    window.location.reload();
    
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    window.location.reload();
  }
}

// Función para crear el widget de usuario
function createUserWidget() {
  if (LOGIN_MODAL_CONFIG.USER_WIDGET_CREATED) return;
  
  // Si ya existe en la cabecera, reutilizarlo con variante hosted
  let userWidget = document.getElementById('userSessionWidget');
  
  if (userWidget) {
    userWidget.classList.add('user-session-widget', 'hosted');
  } else {
    // Si no existe, crearlo dinámicamente (fallback)
    userWidget = document.createElement('div');
    userWidget.id = 'userSessionWidget';
    userWidget.className = 'user-session-widget';
    
    // Insertar al principio del body
    document.body.insertBefore(userWidget, document.body.firstChild);
  }
  
  LOGIN_MODAL_CONFIG.USER_WIDGET_CREATED = true;
  updateUserWidget();
}

// Función para actualizar el widget de usuario
function updateUserWidget() {
  const widget = document.getElementById('userSessionWidget');
  if (!widget) return;

  const user = getCurrentUser();

  if (user && user.nombre) {
    widget.innerHTML = `
      <div class="user-info">
        <span class="user-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style="vertical-align:middle;">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" fill="#fff"/>
            </svg>
        </span>
        <span class="user-name">${user.nombre}</span>
        <button class="logout-btn" onclick="LoginModal.logout()" title="Cerrar Sesión">
          Salir
        </button>
      </div>
    `;
    widget.style.display = 'flex';
  } else {
    widget.style.display = 'none';
  }
}

// Función para crear los estilos del widget de usuario
function createUserWidgetStyles() {
  if (document.getElementById('userWidgetStyles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'userWidgetStyles';
  styles.textContent = `
    .user-session-widget {
      position: fixed;
      bottom: 15px;
      right: 15px;
      z-index: 9999;
      background: linear-gradient(135deg, #0d40afff 0%, #063c68ff 100%);
      border-radius: 25px;
      padding: 8px 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
      animation: slideInFromRight 0.3s ease-out;
    }

    /* Cuando el widget vive dentro del header (hosted) */
    .user-session-widget.hosted {
      position: static;
      top: auto;
      right: auto;
      z-index: auto;
      display: none;
      padding: 6px 6px 6px 12px;
      border-radius: 18px;
      box-shadow: none;
      animation: none;
      background: rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(6px);
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
    }
    
    .user-icon {
      font-size: 16px;
    }
    
    .user-name {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .logout-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 15px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }
    
    .logout-btn:active {
      transform: translateY(0);
    }
    
    .logout-icon {
      font-size: 14px;
    }
    
    @keyframes slideInFromRight {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    /* Responsive para móviles */
    @media (max-width: 768px) {
      .user-session-widget:not(.hosted) {
        position: fixed;
        bottom: 10px;
        right: 10px;
        padding: 6px 12px;
        transform: scale(0.9);
      }
      
      .user-info {
        font-size: 13px;
        gap: 6px;
      }
      
      .user-name {
        max-width: 100px;
      }
      
      .logout-btn {
        padding: 3px 6px;
        font-size: 11px;
      }
    }
  `;
  
  document.head.appendChild(styles);
}

// API pública del módulo
window.LoginModal = {
  // Métodos principales
  show: showLoginModal,
  hide: hideLoginModal,
  checkUser: checkUserSession,
  requireUser: requireUser,
  getCurrentUser: getCurrentUser,
  logout: logoutUser,
  
  // Gestión del widget de usuario
  createUserWidget: createUserWidget,
  updateUserWidget: updateUserWidget,
  
  // Control de verificación automática
  startAutoCheck: startSessionCheck,
  stopAutoCheck: stopSessionCheck,
  
  // Configuración
  config: LOGIN_MODAL_CONFIG,
  
  // Estado (solo lectura)
  get isOpen() { return loginModalState.isOpen; },
  get hasUser() { return checkUserSession(); }
};

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Verificar si la página actual NO es la página de login
    if (!window.location.pathname.includes('Pantalla_login.html')) {
      // Crear estilos del widget
      createUserWidgetStyles();
      // Crear widget de usuario
      createUserWidget();
      // Iniciar verificación de sesión
      startSessionCheck();
    }
  });
} else {
  // DOM ya está listo
  if (!window.location.pathname.includes('Pantalla_login.html')) {
    // Crear estilos del widget
    createUserWidgetStyles();
    // Crear widget de usuario
    createUserWidget();
    // Iniciar verificación de sesión
    startSessionCheck();
  }
}

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
  stopSessionCheck();
});

console.log('🔐 LoginModal cargado - Sistema de autenticación universal activo');
