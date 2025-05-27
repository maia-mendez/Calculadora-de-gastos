document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Verificar si el usuario ya está autenticado
    if (localStorage.getItem('isAuthenticated') === 'true') {
        window.location.href = 'index.html';
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (userManager.authenticateUser(username, password)) {
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('username', username);
            
            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Iniciando sesión...',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'index.html';
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Usuario o contraseña incorrectos'
            });
        }
    });
}); 