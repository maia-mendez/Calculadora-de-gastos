document.addEventListener('DOMContentLoaded', () => {
    const changePasswordForm = document.getElementById('changePasswordForm');
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const token = urlParams.get('token');

    // Verificar que tenemos email y token
    if (!email || !token) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Link inválido o expirado'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }

    // Verificar que el token es válido
    if (!userManager.verifyResetToken(email, token)) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Link inválido o expirado'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }

    changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validar contraseñas
        if (newPassword !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las contraseñas no coinciden'
            });
            return;
        }

        // Validar longitud de contraseña
        if (newPassword.length < 6) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'La contraseña debe tener al menos 6 caracteres'
            });
            return;
        }

        // Cambiar contraseña
        if (userManager.resetPassword(email, token, newPassword)) {
            Swal.fire({
                icon: 'success',
                title: '¡Contraseña cambiada!',
                text: 'Tu contraseña ha sido actualizada correctamente',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cambiar la contraseña'
            });
        }
    });
}); 