class UserManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
    }

    // Registrar un nuevo usuario
    registerUser(username, password, email) {
        if (this.users.some(user => user.username === username)) {
            throw new Error('El nombre de usuario ya existe');
        }
        if (this.users.some(user => user.email === email)) {
            throw new Error('El email ya está registrado');
        }

        const user = {
            username,
            password: this.hashPassword(password),
            email,
            resetToken: null,
            resetTokenExpiry: null
        };

        this.users.push(user);
        this.saveUsers();
        return true;
    }

    // Autenticar usuario
    authenticateUser(username, password) {
        const user = this.users.find(u => u.username === username);
        if (!user) return false;
        
        return this.verifyPassword(password, user.password);
    }

    // Generar token de recuperación
    generateResetToken(email) {
        const user = this.users.find(u => u.email === email);
        if (!user) return false;

        const token = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1); // Token válido por 1 hora

        user.resetToken = token;
        user.resetTokenExpiry = expiry;
        this.saveUsers();

        return token;
    }

    // Verificar token de recuperación
    verifyResetToken(email, token) {
        const user = this.users.find(u => u.email === email);
        if (!user || !user.resetToken || !user.resetTokenExpiry) return false;

        if (user.resetToken !== token) return false;
        if (new Date() > new Date(user.resetTokenExpiry)) return false;

        return true;
    }

    // Cambiar contraseña
    resetPassword(email, token, newPassword) {
        const user = this.users.find(u => u.email === email);
        if (!user) return false;

        if (!this.verifyResetToken(email, token)) return false;

        user.password = this.hashPassword(newPassword);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        this.saveUsers();

        return true;
    }

    // Función simple de hash (en producción usar bcrypt o similar)
    hashPassword(password) {
        return btoa(password); // Solo para demostración, NO usar en producción
    }

    // Verificar contraseña
    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    // Guardar usuarios en localStorage
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }
}

// Exportar la instancia
const userManager = new UserManager(); 