/**
 * LOGIN MODULE - JavaScript Component
 * Sistema de autenticación integrado para todas las pantallas
 */

class LoginModule {
    constructor(apiBaseUrl = '') {
        this.apiBaseUrl = apiBaseUrl;
        this.currentUser = null;
        this.loginModal = null;
        this.init();
    }

    init() {
        this.createLoginModal();
        this.checkAuthStatus();
        this.setupEventListeners();
    }

    createLoginModal() {
        // Crear modal de login si no existe
        if (document.getElementById('loginModal')) return;

        const modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.className = 'login-modal';
        
        modal.innerHTML = `
            <div class="login-form">
                <div class="login-header">
                    <img src="/IMAGENES/Logo_EMESA.png" alt="EMESA" style="height: 40px; margin-bottom: 10px;">
                    <div>Acceso al Sistema CAB</div>
                </div>
                
                <div class="login-error" id="loginError"></div>
                
                <form id="loginForm">
                    <input 
                        type="text" 
                        id="loginUsername" 
                        class="login-input" 
                        placeholder="Número de operario"
                        required
                    >
                    
                    <input 
                        type="password" 
                        id="loginPassword" 
                        class="login-input" 
                        placeholder="Contraseña"
                        required
                    >
                    
                    <button type="submit" class="login-button">
                        Iniciar Sesión
                    </button>
                    
                    <div class="login-loading" id="loginLoading"></div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        this.loginModal = modal;

        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideLogin();
            }
        });
    }

    setupEventListeners() {
        // Formulario de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Botón de logout (se crea dinámicamente)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('logout-btn')) {
                this.handleLogout();
            }
        });
    }

    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/verify_session`, {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success && data.authenticated) {
                this.currentUser = data.user;
                this.updateUserInterface(true);
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const errorDiv = document.getElementById('loginError');
        const loadingDiv = document.getElementById('loginLoading');
        
        if (!username || !password) {
            this.showError('Por favor, complete todos los campos');
            return;
        }

        // Mostrar loading
        loadingDiv.classList.add('show');
        errorDiv.classList.remove('show');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    usuario: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = {
                    id: data.id,
                    num_operario: data.num_operario,
                    nombre: data.nombre,
                    nivel: data.nivel,
                    rol: data.rol
                };
                
                this.updateUserInterface(true);
                this.hideLogin();
                
                // Guardar en localStorage para referencia
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                // Disparar evento personalizado para que las páginas puedan reaccionar
                document.dispatchEvent(new CustomEvent('userLoggedIn', { 
                    detail: this.currentUser 
                }));
                
            } else {
                this.showError(data.message || 'Error de autenticación');
            }
            
        } catch (error) {
            console.error('Error en login:', error);
            this.showError('Error de conexión. Intente nuevamente.');
        } finally {
            loadingDiv.classList.remove('show');
        }
    }

    async handleLogout() {
        try {
            await fetch(`${this.apiBaseUrl}/api/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error en logout:', error);
        }
        
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUserInterface(false);
        this.showLogin();
        
        // Disparar evento de logout
        document.dispatchEvent(new CustomEvent('userLoggedOut'));
    }

    updateUserInterface(isAuthenticated) {
        // Actualizar header con info de usuario
        const userInfoElements = document.querySelectorAll('.user-info');
        
        userInfoElements.forEach(element => {
            if (isAuthenticated && this.currentUser) {
                element.innerHTML = `
                    <span class="user-name">${this.currentUser.nombre}</span>
                    <span class="user-role">(${this.currentUser.rol})</span>
                    <button class="logout-btn">Salir</button>
                `;
                element.classList.add('authenticated');
            } else {
                element.innerHTML = '';
                element.classList.remove('authenticated');
            }
        });
        
        // Mostrar/ocultar contenido principal
        const mainContent = document.querySelector('main') || document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.display = isAuthenticated ? 'block' : 'none';
        }
    }

    showLogin() {
        if (this.loginModal) {
            this.loginModal.classList.add('show');
            // Focus en el primer input
            setTimeout(() => {
                const usernameInput = document.getElementById('loginUsername');
                if (usernameInput) usernameInput.focus();
            }, 100);
        }
    }

    hideLogin() {
        if (this.loginModal) {
            this.loginModal.classList.remove('show');
            document.getElementById('loginForm').reset();
            document.getElementById('loginError').classList.remove('show');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
        }
    }

    // Métodos públicos para uso en las páginas
    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    hasPermission(requiredLevel) {
        return this.currentUser && this.currentUser.nivel >= requiredLevel;
    }
}

// Instancia global del módulo de login
let loginModule;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Usar ruta relativa para la API (compatible con cualquier configuración)
    const apiBaseUrl = ''; // Usar rutas relativas
    
    loginModule = new LoginModule(apiBaseUrl);
});

// Exportar para uso global
window.LoginModule = LoginModule;
window.loginModule = loginModule;