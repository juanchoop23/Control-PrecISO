// js/auth.js
// FUNCIONES PARA AUTENTICACIÓN CON COGNITO (API DIRECTA)

// Función para iniciar sesión
async function login(email, password) {
    try {
        // Usar la API directa de Cognito, NO necesita dominio
        const response = await fetch(`https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-amz-json-1.1',
                'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
            },
            body: JSON.stringify({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: COGNITO_CONFIG.clientId,
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error response:', error);
            
            // Manejar diferentes tipos de errores
            if (error.message === 'User does not exist') {
                throw new Error('El usuario no existe');
            } else if (error.message === 'Incorrect username or password') {
                throw new Error('Contraseña incorrecta');
            } else if (error.message === 'User is not confirmed') {
                throw new Error('El usuario no ha confirmado su email. Revisa tu bandeja de entrada.');
            } else {
                throw new Error(error.message || 'Error al iniciar sesión');
            }
        }

        const data = await response.json();
        
        // Guardar el token en localStorage
        localStorage.setItem('access_token', data.AuthenticationResult.AccessToken);
        localStorage.setItem('id_token', data.AuthenticationResult.IdToken);
        localStorage.setItem('refresh_token', data.AuthenticationResult.RefreshToken);
        localStorage.setItem('user_email', email);
        
        return { success: true };
        
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, error: error.message };
    }
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirado = payload.exp * 1000 < Date.now();
        return !expirado;
    } catch {
        return false;
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    window.location.href = 'index.html';
}

// Función para obtener el token (para enviar en peticiones a tu API)
function getAccessToken() {
    return localStorage.getItem('access_token');
}

// Función para obtener el email del usuario autenticado
function getUserEmail() {
    return localStorage.getItem('user_email');
}
// Obtener el rol del usuario desde el token JWT
function getUserRole() {
    const token = localStorage.getItem('id_token');
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const groups = payload['cognito:groups'] || [];
        if (groups.includes('Superadmin')) return 'Superadmin';
        if (groups.includes('AdminEmpresa')) return 'AdminEmpresa';
        if (groups.includes('UsuarioEmpresa')) return 'UsuarioEmpresa';
        return null;
    } catch (error) {
        console.error('Error al decodificar token:', error);
        return null;
    }
}


// Obtener el ID de la empresa del usuario logueado
// Función para obtener el token
function getAccessToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('id_token');
}

// Obtener el ID de la empresa del usuario logueado
async function getEmpresaId() {
    const token = getAccessToken();
    if (!token) {
        console.error('No hay token de acceso');
        return null;
    }
    
    try {
        const response = await fetch('https://cf759ojbfj.execute-api.us-east-1.amazonaws.com/V1/usuarios/empresa', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error('Error al obtener empresa_id:', response.status);
            return null;
        }
        
        const data = await response.json();
        console.log('Empresa ID recibido:', data.empresa_id);
        return data.empresa_id;
    } catch (error) {
        console.error('Error en getEmpresaId:', error);
        return null;
    }
}