// Configuración específica para la aplicación SGA EMESA
// ====================================================

// Configuración del modal de login para SGA
window.LOGIN_MODAL_CONFIG = window.LOGIN_MODAL_CONFIG || {};

// Sobrescribir configuraciones específicas para tu aplicación
Object.assign(window.LOGIN_MODAL_CONFIG, {
  API_BASE_URL: 'http://192.168.1.41:3011', // Tu servidor específico
  AUTO_CHECK_INTERVAL: 30000, // Verificar cada 30 segundos
  REDIRECT_DELAY: 1500,
  DEBUG_MODE: false
});

// Función para personalizar el modal según tu aplicación
document.addEventListener('DOMContentLoaded', function() {
  // Personalizar mensajes del modal
  const originalShowMessage = window.showLoginMessage;
  window.showLoginMessage = function(message, type) {
    // Personalizar mensajes específicos
    if (message.includes('Usuario o contraseña incorrectos')) {
      message = 'Credenciales incorrectas. Verifique su número de operario y contraseña.';
    }
    if (originalShowMessage) {
      originalShowMessage(message, type);
    }
  };

  console.log('🔧 Configuración SGA EMESA aplicada');
  console.log(`📡 API URL: ${window.LOGIN_MODAL_CONFIG.API_BASE_URL}`);
});

// Función helper para debug (solo en desarrollo)
window.SGA_DEBUG = {
  checkUser: function() {
    const user = EmesaHelpers.getCurrentUser();
    console.log('👤 Usuario actual:', user);
    return user;
  },
  
  testAuth: function(level = 1) {
    EmesaHelpers.requireAuth((user) => {
      console.log(`✅ Test de autenticación exitoso para nivel ${level}:`, user);
      alert(`Autenticado como ${user.nombre} (Nivel ${user.nivel})`);
    }, level, `Test de autenticación para nivel ${level}`);
  },
  
  clearSession: function() {
    localStorage.removeItem('usuarioSGA');
    console.log('🗑️ Sesión limpiada');
    window.location.reload();
  }
};

console.log('🚀 SGA EMESA Config cargado');