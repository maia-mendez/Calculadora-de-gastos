# Calculadora de Gastos Mensuales

Una aplicación web para gestionar y controlar tus gastos mensuales de manera eficiente.

## Características

- 🔐 Sistema de autenticación de usuarios
- 📊 Visualización de gastos en gráficos
- 📱 Diseño responsive
- 🌓 Modo claro/oscuro
- 📤 Exportación a CSV y PDF
- 📅 Filtros por fecha y categoría
- 💾 Almacenamiento local de datos

## Tecnologías Utilizadas

- HTML5
- CSS3
- JavaScript
- Chart.js para gráficos
- SweetAlert2 para notificaciones
- jsPDF para exportación a PDF
- Font Awesome para íconos

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/tu-usuario/calculadora-gastos.git
```

2. Instala las dependencias del backend:
```bash
cd backend
pip install flask-mail
```

3. Configura las variables de entorno:
   - Copia el archivo `.env.example` a `.env`
   - Edita el archivo `.env` con tus credenciales:
     ```
     EMAIL_USER=tu_correo@gmail.com
     EMAIL_PASSWORD=tu_contraseña_de_aplicacion
     ```
   - Para obtener la contraseña de aplicación de Gmail:
     1. Ve a tu cuenta de Google
     2. Activa la verificación en dos pasos si no está activada
     3. Ve a "Seguridad" > "Contraseñas de aplicación"
     4. Genera una nueva contraseña para la aplicación

4. Inicia el servidor backend:
```bash
python app.py
```

5. Abre el archivo `index.html` en tu navegador

## Uso

1. Regístrate con un nuevo usuario
2. Inicia sesión con tus credenciales
3. Comienza a registrar tus gastos
4. Utiliza los filtros para analizar tus gastos
5. Exporta tus datos cuando lo necesites

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir los cambios que te gustaría hacer.

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 