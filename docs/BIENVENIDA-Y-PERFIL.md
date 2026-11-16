# Bienvenida y perfil simplificado

Después de ingresar con contraseña o mediante Google, GitHub o Discord, R5 abre
/bienvenida. Esa página saluda al usuario confirmado y ofrece Configurar mi perfil.
El acceso de administradores también comienza allí, con Administración en la navegación.

/perfil muestra una tarjeta con nombre visible, usuario y email, siguiendo el recorrido
sencillo de la tarjeta de R1. Editar perfil abre un borrador. Guardar cambios valida
los campos y espera la respuesta de PUT /api/users/me antes de actualizar la tarjeta.
Cancelar descarta el borrador. Si la API rechaza el guardado, el formulario queda
abierto con el error y conserva los datos confirmados.

Las opciones de email y contraseña están agrupadas en un panel desplegable. Las
cuentas vinculadas tienen otro panel. Ambos conservan sus servicios y validaciones.

Los archivos principales son frontend/src/pages/WelcomePage.jsx,
frontend/src/pages/ProfilePage.jsx y
frontend/src/components/profile/ProfileDetailsForm.jsx. El login local navega desde
context/AuthContext.jsx. HomePage, LoginPage, RegisterPage y CodePage comparten el
destino /bienvenida. El callback social usa ese mismo destino desde
backend/controllers/oauthController.js.

La tarjeta guarda por la API existente en MySQL. La bienvenida muestra el perfil
confirmado del contexto de autenticación. Las rutas siguen protegidas por sesión.

Se aprobaron 16 pruebas del frontend y 61 del backend, junto con lint y compilación.
Las pruebas nuevas cubren cancelar, guardar, fallo de API, ingreso de usuario/admin
y callback exitoso de Google, GitHub y Discord con servicios aislados.
La prueba de producción también comprueba que /bienvenida entregue la aplicación.

Esta revisión se ejecuta localmente en http://localhost:5173/.
