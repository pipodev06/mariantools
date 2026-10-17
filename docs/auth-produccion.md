# Inicio de sesión en producción (2026-10-16)

La app ofrece dos formas de entrar (`src/components/LoginForm.tsx`): **Google** y un **código de 6 dígitos** enviado al correo (el mismo correo trae un enlace de acceso que también sirve). Para que funcione con usuarios reales hay que configurar cosas en los paneles; nada de esto está en el código.

## 1. Correo propio (obligatorio)
El correo por defecto de Supabase solo entrega a miembros del equipo de la organización, con límite bajo por hora y sin garantía: **no sirve para producción**.

1. Comprar el dominio y elegir un proveedor de correo (Resend, Brevo, Postmark, Amazon SES, Mailgun). Verificar sus límites gratuitos vigentes.
2. En el DNS del dominio, añadir los registros SPF y DKIM que indique el proveedor (y DMARC).
3. Supabase → Authentication → SMTP Settings: activar SMTP propio con remitente `no-reply@<dominio>` y nombre "MarianTools".

## 2. Plantillas de correo (Authentication → Email Templates)
Editar **Magic Link** y **Confirm signup** (un usuario nuevo recibe la segunda). Asunto sugerido: `Tu código de acceso a MarianTools`. Cuerpo (incluye código y enlace):

```html
<h2>Tu código de acceso</h2>
<p>Tu código de MarianTools es:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>También puedes <a href="{{ .ConfirmationURL }}">entrar con este enlace</a>.</p>
<p>Si no lo pediste tú, ignora este mensaje.</p>
```

Authentication → Providers → Email: dejar activo "Confirm email" y comprobar que la longitud del código sea 6 (el formulario pide exactamente 6 dígitos; si cambias la longitud, cambia `CODE_LENGTH` en `LoginForm.tsx`).

## 3. Google
1. Google Cloud Console → APIs y servicios → Credenciales → ID de cliente OAuth (aplicación web). Orígenes autorizados: `https://www.mariantools.com` (y `http://localhost:5173` para desarrollo). URI de redirección autorizado: el que muestra Supabase en Authentication → Providers → Google (`https://<ref>.supabase.co/auth/v1/callback`).
2. Pantalla de consentimiento: nombre "MarianTools", correo de soporte, política de privacidad `https://www.mariantools.com/privacidad` y términos `/terminos`. Publicarla en "producción" para que cualquier cuenta de Google pueda entrar.
3. Copiar el Client ID y el Client Secret en Supabase → Authentication → Providers → Google y activarlo.

## 4. URLs
Supabase → Authentication → URL Configuration:
- Site URL: `https://www.mariantools.com`
- Redirect URLs: `https://www.mariantools.com/cuenta` y `http://localhost:5173/cuenta`.

## 5. Antes de lanzar
- Probar con un correo ajeno al equipo (código y enlace) y con una cuenta de Google nueva.
- Revisar Authentication → Rate Limits (correos por hora, intentos de verificación).
- Abuso del bono de bienvenida: con correos desechables se pueden crear cuentas para cobrar los 5 créditos; si pasa, bajar o quitar el bono.
