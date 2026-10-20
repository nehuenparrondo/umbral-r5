# Pruebas manuales del sistema de usuarios y Mailtrap

Esta guia comprueba que R5 conserva el sistema completo de R3 y agrega OAuth como metodo adicional.

## Preparacion

1. Abrir en VS Code la carpeta `Estanguita/R5`.
2. Ejecutar `npm run doctor`; debe informar MySQL conectado y rol SQL limitado.
3. Ejecutar `npm run mail:check`; debe informar conexion y autenticacion SMTP correctas.
4. Ejecutar `npm run dev` y abrir `http://localhost:5173/login`.

## Registro y verificacion

1. Elegir **Crear una**, completar datos validos y enviar el formulario.
2. Confirmar que la aplicacion abre **Verificar email** sin iniciar sesion todavia.
3. Abrir la bandeja Email Sandbox de Mailtrap configurada en `backend/.env`.
4. Copiar el codigo de seis digitos y confirmarlo en R5.
5. Iniciar sesion con email o username y comprobar la llegada a **Tu perfil**.

## Bloqueo y recuperacion

1. Cerrar sesion e ingresar tres veces una contrasena incorrecta.
2. Elegir **Ingresar con un codigo**, solicitarlo y leerlo en Mailtrap.
3. Confirmar el codigo; la cuenta debe quedar desbloqueada y con sesion activa.
4. Repetir desde **Olvide mi contrasena**, definiendo una clave nueva.
5. Confirmar que la clave anterior deja de funcionar y la nueva permite ingresar.

## Perfil

1. Cambiar nombre visible o username y comprobar que el email no se edita en ese formulario.
2. En **Cambiar email**, validar la contrasena actual.
3. Leer el codigo enviado al nuevo destino en Mailtrap y confirmarlo.
4. Cambiar la contrasena y comprobar que otras sesiones se revocan.
5. Revisar **Cuentas vinculadas**; despues de OAuth debe aparecer el proveedor usado.

## Diagnostico rapido

- Si Mailtrap falla: revisar solo las variables `SMTP_*` de `backend/.env` y ejecutar `npm run mail:check`.
- Si MySQL falla: ejecutar `npm run db:start` y luego `npm run doctor`.
- Si un proveedor social esta desactivado: completar su client ID, secret y callback exacto; no se reemplaza con un login simulado.

<!-- This file exports: manual verification steps for R3 user flows in R5. -->
<!-- It is used by: students and reviewers. -->
<!-- It imports from: README, backend/.env.example and the implemented UI/API flows. -->
