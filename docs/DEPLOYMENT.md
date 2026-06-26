# Despliegue

## Supabase

- Ejecutar en orden la migración V2 y la migración aditiva `202606240002_session_sets.sql` en SQL Editor.
- Activar confirmación de correo y SMTP propio.
- Registrar `/auth/confirm` para local, preview y producción.
- No incluir `SUPABASE_SERVICE_ROLE_KEY` en variables públicas.

## Vercel

- Configurar todas las variables de `.env.example`.
- `CRON_SECRET` protege la limpieza diaria de conversaciones vencidas.
- `OPENAI_API_KEY`, `USDA_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` son secretos de servidor.
- Verificar `/offline`, `manifest.webmanifest` y el service worker después del build.

## OpenAI

- Responses API usa `store: false`, salida JSON estructurada y contexto mínimo.
- Los datos enviados no incluyen nombre, correo ni notas clínicas completas.
- Revisar controles de retención de la organización antes de producción.
